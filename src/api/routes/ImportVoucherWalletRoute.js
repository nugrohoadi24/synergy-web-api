const config = require('../config/config');
const strHelper = require('../helper/StringHelper');
const router = require('express').Router();
const ImportVoucher = require('../models/ImportVoucherWallet');

const User = require('../models/User');
const Voucher = require('../models/Voucher');
const VoucherWallet = require('../models/VoucherWallet');
const Provider = require('../models/Hospital');

var ObjectID = require('mongodb').ObjectID;
const mongoose = require('mongoose');

const moment = require("moment");
var mime = require('mime');
const apihelper = require('../helper/APIHelper');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
var busboy = require('connect-busboy')
var kue = require('kue')
var queue = kue.createQueue({
    redis: {
      port: config.redisPort,
      host: config.redisHost,
      auth: config.redisPass
    }
  });



var uploadedRecord = 0;
var uploadMessage = "";
var uploadStatus = "";


router.post("/approve/:uploadId/:status",apihelper.authAccessOr({
    IMPORTVOUCHERWALLETAPPROVE :config.action.Create | config.action.Update
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.uploadId;
    const approvalstatus = req.params.status;

    //var importVoucherData =await ImportVoucher.findOne({_id:ObjectID(id),status:config.upload_voucher_wallet_status.NEW});    
    var importVoucherData =await ImportVoucher.findOne({_id:ObjectID(id)});    
    if(importVoucherData !=null){   
        let session = await mongoose.startSession();
        try{
            for (var index = 0;index < importVoucherData.data.length; index++){
                if(importVoucherData.data[index].status === config.upload_voucher_wallet_detail_status.NEW){
                    if(approvalstatus==config.upload_voucher_wallet_status.APPROVED)
                        importVoucherData.data[index].status = config.upload_voucher_wallet_status.APPROVED;
                    else
                        importVoucherData.data[index].status = config.upload_voucher_wallet_status.REJECTED;
                }
            }

            await session.withTransaction(async () => {
                var updateres = await ImportVoucher.update({
                    _id:importVoucherData._id, __v: importVoucherData.__v }, 
                    {$inc: {__v:1},
                    status: (approvalstatus==config.upload_voucher_wallet_status.APPROVED?config.upload_voucher_wallet_status.APPROVED:config.upload_voucher_wallet_status.REJECTED),
                    updated_by: req.user,
                    updated_at: moment().utc().toDate(),
                    approved_at: moment().utc().toDate(),
                    approved_status: approvalstatus,
                    approved_by: req.user
                },{session: session});

        
                if (updateres.nModified == 1) {
                    var result = false;
                    var msg = "";
        
                    queue.create("process_approved_data_voucher", {
                        importVoucherData: importVoucherData        
                    }).on('complete', function(result){
                        result = true;
                        msg = "Request import voucher berhasil di approve";
                    }).on('failed attempt', function(errorMessage, doneAttempts){
                        throw new Error(errorMessage);
                    }).on('failed', function(errorMessage){
                        throw new Error(errorMessage);
                    }).on('progress', function(progress, data){
                    }).priority("high").save();
        
                    return apihelper.APIResponseOK(res, true, "Request import voucher berhasil di approve",undefined);    
                }else{
                    throw new Error("Request import tidak berhasil di approve, silahkan coba kembali"); 
                }
            });
        }catch(exc){
            return apihelper.APIResponseOK(res, false, exc.message,undefined);    
        }
        await session.endSession();        
    }else {
        return apihelper.APIResponseOK(res, false,"data import voucher tidak ditemukan atau telah di approve",undefined);    
    }
}))

router.post("/upload",apihelper.authAccessOr({
    IMPORTVOUCHERWALLET :config.action.Create | config.action.Update
}) ,apihelper.handleErrorAsync(async (req, res, next) => {

    uploadedRecord = 0;
    var fstream;

    var uploadMessage = "";
    var uploadStatus = false;
    var voucher = "";
    var fileAbsPath = "";
    
    req.busboy.on('field', (fieldname, value) => {
        if(fieldname === "voucher")
            voucher = value
    });
    
    req.busboy.on('error', (err) => {
        debugLog(options, `Busboy error`);
        next(err);
        return apihelper.APIResponseErr(res,false,err,null);
    });

    req.busboy.on('file',  (fieldname, file, filename) => {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.csv')){
            return apihelper.APIResponseErr(res,false,"File yg dapat di upload hanya CSV",null);
        }

        console.log("New file uploaed");

        if (!fs.existsSync(config.uploadTempPath + '/import_voucher')){
            fs.mkdirSync(config.uploadTempPath + '/import_voucher');
        }

        fileAbsPath = config.uploadTempPath + '/import_voucher/' + strHelper.generateRandom(30) + ".csv";

        fstream = fs.createWriteStream(fileAbsPath);
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename);            
        });
        
    });

    req.busboy.on('finish', async () =>{
        if(apihelper.isEmptyObj(fileAbsPath) || apihelper.isEmptyObj(voucher))
            return apihelper.APIResponseOK(res,false,"File harus ada dan Voucher harus di pilih",null);

        var voucherData = await Voucher.findOne({_id:ObjectID(voucher)}); 
        if(voucherData == null)
            return apihelper.APIResponseErr(res,false,"Voucher tidak valid",null);
        

            
        var provider = await Provider.findOne({_id: ObjectID(voucherData.provider)});

        var tempVoucherWalletImport = new ImportVoucher();
        tempVoucherWalletImport.voucher= voucherData._id;
        tempVoucherWalletImport.voucher_data = {
            name : voucherData.name,
            provider : voucherData.provider,
            provider_name : provider.name,
            provider_code : provider.code
        };
        tempVoucherWalletImport.file_path = fileAbsPath;
        
        tempVoucherWalletImport.data= [];
        tempVoucherWalletImport.status= config.upload_voucher_wallet_status.NEW;
        tempVoucherWalletImport.success_count= 0;
        tempVoucherWalletImport.failed_count= 0;
        tempVoucherWalletImport.data_count= 0;

        tempVoucherWalletImport.created_by = req.user;
        tempVoucherWalletImport.created_at = moment().utc().toDate();
        
        var stream = fs.createReadStream(fileAbsPath).pipe(csv.parse({ headers: true }))
        .on('error', error => {
            tempVoucherWalletImport.status = config.upload_voucher_wallet_detail_status.FAILED;
            tempVoucherWalletImport.note = error;              
            return apihelper.APIResponseOK(res,false,error,null);
        }).on('data',(row) => {
            row.voucher_code = apihelper.cleanString(row.voucher_code);
            row.user_id = apihelper.cleanString(row.user_id);        
            row.expired_date = apihelper.cleanString(row.expired_date);
            row.status = config.upload_voucher_wallet_detail_status.NEW;
    
            try{
                if(Boolean(row.expired_date))
                    var tmp = moment.utc(row.expired_date,"DD/MM/YYYY")
    
                if(tmp.isValid() )
                    row.expired_date = tmp.toDate();
                else{
                    row.status =  config.upload_voucher_wallet_detail_status.FAILED;
                    row.errormsg = "Invalid expired date date format, Should be DD/MM/YYYY";    
                }
            }catch(e){
                row.status = config.upload_voucher_wallet_detail_status.FAILED;
                row.errormsg = "Invalid expired date format, Should be DD/MM/YYYY";
            }
                row.voucher_code = apihelper.uppercaseString(row.voucher_code);
            tempVoucherWalletImport.data.push (row);
            tempVoucherWalletImport.data_count++;
        })
        .on('end', async(rowCount) => {
            let session = await mongoose.startSession();
            try{
                await session.withTransaction(async () => {
                    var savedData = await tempVoucherWalletImport.save(session);
    
                    var voucherDataQueried = await ImportVoucher.aggregate([
                        {$match :{"_id":ObjectID(savedData._id)}},
                        { $unwind: "$data"},
                        {$lookup: { 
                            from: "user",
                            localField:"data.user_id",
                            foreignField:"userId",
                            as:"user",
                        }},
                        { $unwind: "$user"}
                    ]).session(session).exec();
    
                    for(var index = 0;index < voucherDataQueried.length; index++){
                        var temp = tempVoucherWalletImport.data[index];
                        var finddata = voucherDataQueried.find( x => x.data.voucher_code === temp.voucher_code);
    
                        if(Boolean(finddata) && Boolean(finddata.user)){
                            tempVoucherWalletImport.data[index].user = {
                                _id: finddata.user._id,
                                userId: finddata.user.userId,
                                nama: finddata.user.nama,
                                email: finddata.user.email,
                                phone: finddata.user.phone
                            }
                        }
                    } 
    
    
                    var result = await ImportVoucher.findByIdAndUpdate({_id:tempVoucherWalletImport._id}, tempVoucherWalletImport,{
                        session: session 
                    }).exec();    
                });
                uploadStatus = true;
            }catch(exc){
                console.log(exc);
                uploadStatus = false;
                uploadMessage = exc.message;
            }finally{
                session.endSession();
                return apihelper.APIResponseOK(res,uploadStatus,uploadMessage,null);
            }
    
        });    
    });
    req.pipe(req.busboy);    
}))

/*queue.process("procesUploadVoucher",async (job, done) => {
    var voucherData = job.data.voucherData;
    console.log("File CSV uploaded at " + job.data.path );  

    var provider = await Provider.findOne({_id: ObjectID(voucherData.provider)});

    var tempVoucherWalletImport = new ImportVoucher();
    tempVoucherWalletImport.voucher= voucherData._id;
    tempVoucherWalletImport.voucher_data = {
        name : voucherData.name,
        provider : voucherData.provider,
        provider_name : provider.name,
        provider_code : provider.code
    };
    
    tempVoucherWalletImport.data= [];
    tempVoucherWalletImport.status= config.upload_voucher_wallet_status.NEW;
    tempVoucherWalletImport.success_count= 0;
    tempVoucherWalletImport.failed_count= 0;
    
    var stream = fs.createReadStream(job.data.path).pipe(csv.parse({ headers: true }))
    .on('error', error => {
        tempVoucherWalletImport.status = config.upload_voucher_wallet_detail_status.FAILED;
        tempVoucherWalletImport.note = error;              
    }).on('data',(row) => {
        row.voucher_code = apihelper.cleanString(row.voucher_code);
        row.user_id = apihelper.cleanString(row.user_id);        
        row.expired_date = apihelper.cleanString(row.expired_date);
        row.status = config.upload_voucher_wallet_detail_status.NEW;

        try{
            if(Boolean(row.expired_date))
                var tmp = moment.utc(row.expired_date,"DD/MM/YYYY")

            if(tmp.isValid() )
                row.expired_date = tmp.toDate();
            else{
                row.status =  config.upload_voucher_wallet_detail_status.FAILED;
                row.status_message = "Invalid expired date date format, Should be DD/MM/YYYY";    
            }
        }catch(e){
            row.status = config.upload_voucher_wallet_detail_status.FAILED;
            row.status_message = "Invalid expired date format, Should be DD/MM/YYYY";
        }

        row.voucher_code = apihelper.uppercaseString(row.voucher_code);
        tempVoucherWalletImport.data.push (row)
    })
    .on('end', async(rowCount) => {
        let session = await mongoose.startSession();
        try{
            await session.withTransaction(async () => {
                var savedData = await tempVoucherWalletImport.save(session);

                var voucherDataQueried = await ImportVoucher.aggregate([
                    {$match :{"_id":ObjectID(savedData._id)}},
                    { $unwind: "$data"},
                    {$lookup: { 
                        from: "user",
                        localField:"data.user_id",
                        foreignField:"userId",
                        as:"user",
                    }},
                    { $unwind: "$user"}
                ]).session(session).exec();

                for(var index = 0;index < voucherDataQueried.length; index++){
                    var temp = tempVoucherWalletImport.data[index];
                    var findUser = voucherDataQueried.find( x => x.data.voucher_code === temp.voucher_code).user;

                    if(findUser!=null){
                        tempVoucherWalletImport.data[index].user = {
                            userId: findUser.userId,
                            nama: findUser.nama,
                            email: findUser.email,
                            phone: findUser.phone
                        }
                    }
                } 


                var result = await ImportVoucher.findByIdAndUpdate({_id:tempVoucherWalletImport._id}, tempVoucherWalletImport,{
                    session: session 
                }).exec();    
            });
        }catch(exc){
            console.log(exc);
        }
        session.endSession();

        console.log("Finished Upload");
        done();
    });    
});*/


queue.process("process_approved_data_voucher",async (job, done) => {
    var importvoucherData = job.data.importVoucherData

    var walletDataList = [];



    for(var loop=0; loop < importvoucherData.data.length; loop++){                
        var walletImportData = importvoucherData.data[loop];

        if(walletImportData.status === config.upload_voucher_wallet_detail_status.APPROVED){
            var purchaseNote = undefined;
            var purchaseTransactionDate = undefined;
            var userId = undefined;
            
            if(Boolean(walletImportData.user)){
                purchaseNote = "UPLOAD";
                userId = ObjectID(walletImportData.user._id);
                purchaseTransactionDate = moment().utc().toDate();
            }

            var walletData = {
                voucher_code: walletImportData.voucher_code,
                user : userId,
                purchase_date : purchaseTransactionDate,
                source : "UPLOAD",                
                purchase_note : purchaseNote,
                voucher : importvoucherData.voucher,
                provider: ObjectID(importvoucherData.voucher_data.provider),
                expired_date : walletImportData.expired_date,
                activate_date : moment().utc().toDate(),
                is_active : true,
                upload_from_id : ObjectID(importvoucherData._id),
                created_at : moment().utc().toDate(), 
                created_by : importvoucherData.created_by,
                uploadIndex : loop
            }
            walletDataList.push(walletData);
        }

    }
    
    /*INSERT VOUCHER DATA*/
    if(walletDataList.length>0){
    
        let session = await mongoose.startSession();
        try{
            var voucherData = await Voucher.findOne({_id: ObjectID(importvoucherData.voucher), is_active:true }).exec();  

            var newWalletCount = 0;
            var newPurchaseCount = 0;

            //#Update#
    		await session.withTransaction(async () => {
                try{
                    var result1 = await VoucherWallet.insertMany(walletDataList,{ordered: false,rawResult:true }).catch(ex => {
                        if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                            for(var key in ex.writeErrors){
                                var tmp = ex.writeErrors[key];
                                walletDataList[tmp.err.index].errormsg = tmp.errmsg
                            }
                        }							
                    });
                } catch(ex){
                    //sini kena error langsung batal transaksi
                    if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                        for(var key in ex.writeErrors){
                            var tmp = ex.writeErrors[key];
                            walletDataList[tmp.err.index].errormsg = tmp.errmsg
                        }
                    }
                }            
        
                for(var key in walletDataList){
                    var tmp  = walletDataList[key];      
                    var tmpVOucherWallet =  importvoucherData.data[tmp.uploadIndex];

                    if(Boolean(tmp.errormsg) && tmp.errormsg.length > 0){
                        tmpVOucherWallet.errormsg = tmp.errormsg;
                        tmpVOucherWallet.status = config.upload_voucher_wallet_detail_status.FAILED;
                    }else{
                        if(Boolean(tmpVOucherWallet.user)){
                            newPurchaseCount++;  //ddianggap pembelian di voucher karena wallet di assign
                        }else {
                            newWalletCount++;
                        }
                        tmpVOucherWallet.status = config.upload_voucher_wallet_detail_status.PROCESSED;
                    }                
                }

                console.log("Update Voucher");
                  updateres = await Voucher.update({_id:voucherData._id, __v: voucherData.__v }, 
                    {$inc: {
                        purchase_count : newPurchaseCount,
                        __v:1}}
                    ,{session: session});
                console.log("Update Vouccher End");

                if (updateres.nModified == 0) {
                    throw new Error("Silahkan coba kembali, tidak dapat mengupdate data penggunaan voucher");
                }
            });
            importvoucherData.status = config.upload_voucher_wallet_status.PROCESSED;
            importvoucherData.success_count = newWalletCount + newPurchaseCount;
            importvoucherData.failed_count = walletDataList.length - (newWalletCount + newPurchaseCount);
    
        } catch(ex){
            importvoucherData.status = config.upload_voucher_wallet_status.FAILED;
            importvoucherData.note = ex.message;
        }
        await session.endSession();            
    }else{
        importvoucherData.status = config.upload_voucher_wallet_status.FAILED;
        importvoucherData.note = "Tidak ada data yg di proses";
    }
    var result = await ImportVoucher.findByIdAndUpdate({_id:importvoucherData._id}, importvoucherData).exec();         
    done();
})



router.get("/upload/progress", apihelper.authAccessOr({IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = {
        "uploadedRecord":uploadedRecord,
        "uploadStatus":uploadStatus,
        "uploadMessage":uploadMessage
    }
    return apihelper.APIResponseOK(res,true,"",data);
}))

router.get("/upload/status", apihelper.authAccessOr({IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var dbData = await ImportVoucher.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).exec();

    var data = {
        "new":0,
        "Processed":0,
        "approved":0,
        "failed":0,
        "all":0
    }

    
    if(Boolean(dbData)){
        dbData.forEach(x => {
            if(x._id == 'FAILED')
                data.failed = x.count;
            else if(x._id == 'PROCESSED')
                data.processed = x.count;
            else if(x._id == 'APPROVED')
                data.approved = x.count;
            else if(x._id == 'NEW')
                data.new = x.count;
        });
        data.uploaded = data.failed + data.new + data.processed;
    }

    return apihelper.APIResponseOK(res,true,"",data);
}))

router.get("/download/failed", apihelper.authAccessOr({IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const cursor = ImportUser.find({status:'FAILED'});
    
    const transformer = (doc)=> {
        return {
            nama: doc.nama,
            email: doc.email,
            company: doc.company,
            handphone:"'" + doc.handphone ,
            phone:"'" + doc.phone,
            userId: doc.userId,
            password: doc.password,
            dob: "'" + moment.utc(doc.dob).format("DD/MM/YYYY"),
            nik: "'" + doc.nik,
            address: doc.address,
            province: doc.province,
            city: doc.city,
            district: doc.district,
            subdistrict: doc.subdistrict,
            zipcode: doc.zipcode,
            status:doc.status_message
        };
    }

    const filename = 'failed_import_user_' + moment().format("DD-MM-YYYY_HH_mm_ss") + '.csv';

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.writeHead(200, { 'Content-Type': 'text/csv' });

    res.flushHeaders();
    var csvStream = csv.format({ headers: true }).transform(transformer);
    //var csvStream = csv.createWriteStream({headers: true}).transform(transformer)
    cursor.stream().pipe(csvStream).pipe(res);
}));

router.get("/template", apihelper.handleErrorAsync(async (req, res, next) => {
    var file =  './template/importVoucherWallet.csv';
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);
  
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
}));


//Ambil data voucher uploadlist 
router.get("/", apihelper.authAccessOr({
    IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete,
    IMPORTVOUCHERWALLETAPPROVE: config.action.View | config.action.Update  | config.action.Delete,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,wait_approve,sb,sd,status} = req.query;
    
    var filter = {};
    if(wait_approve){
        filter = {approved_by: { $eq: null }};
    }

    if(Boolean(status)){
        filter.status = status;
    }

    var result = await ImportVoucher.aggregate([
        {$match : filter},
        {$lookup: { 
            from: "admin",
            localField:"created_by",
            foreignField:"_id",
            as:"created_by_user"
        }}, 
        {$unwind: {
            "path": "$created_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "admin",
            localField:"approved_by",
            foreignField:"_id",
            as:"approved_by_user"
        }},         
        {$unwind: {
            "path": "$approved_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "voucher",
            localField:"voucher",
            foreignField:"_id",
            as:"voucher_data"
        }},         
        {$unwind: {
            "path": "$voucher_data",
            "preserveNullAndEmptyArrays": true
        }},
        { $project: {'_id':1,'voucher_data':1,'status':1,'success_count':1,'failed_count':1,'created_at':1,'note':1,'data_count':1,
                        'approved_at':1,'approved_status':1,'desc':1,'approved_by_user._id':1,'approved_by_user.name':1,'created_by_user._id':1,'created_by_user.name':1
        }},
        { $sort: {'created_at':-1}},
        {
            $facet: {
                docs: [{ $skip: (parseInt(page)-1) * parseInt(perpage) }, { $limit: parseInt(perpage) }],
                totalCount: [{
                    $count: 'count'
                }]
            }
        }
    ]).exec();

    
    if(result != null && result.length > 0){
        var totalCount = 0;
        if(Boolean(result[0].totalCount) && result[0].totalCount.length > 0)
            totalCount = result[0].totalCount[0].count;
        
        if(result[0].docs){
            for(var x=0;x< result[0].docs.length;x++){
                result[0].docs[x].desc = result[0].docs[x].certificate_no + " / "+ result[0].docs[x].nama_tertanggung + " / " + moment(result[0].docs[x].dob_tertanggung).format("DD MMM YYYY") ;
            }
        }

        return apihelper.APIResponseOK(res,true,"",{
            page:page,
            pages:Math.ceil(totalCount/perpage),
            total:totalCount,
            limit:perpage,
            docs:result[0].docs
        });    
    }else {
        return apihelper.APIResponseOK(res,true,"",undefined);
    }

}))


router.get("/datadetail/:id", apihelper.authAccessOr({
    IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete,
    IMPORTVOUCHERWALLETAPPROVE: config.action.View | config.action.Update  | config.action.Delete,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,wait_approve,sb,sd,searchquery} = req.query;
    const dataid = req.params.id;
    
    var finalQuery = {};
    if(searchquery){
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({"data.voucher_code" : q});
        finalQuery["$or"].push({"data.user.nama" : q});
        finalQuery["$or"].push({"data.user.email" : q});
        finalQuery["$or"].push({"data.user.handphone" : q});
        finalQuery["$or"].push({"data.user_id" : q});
        finalQuery["$or"].push({"data.errormsg" : q});
    }

    var result = await ImportVoucher.aggregate([
        {$match : {_id:ObjectID(dataid)}}, 
        {$unwind: "$data"},
        {$match : finalQuery},
        {$project: {'_id':1,'data':1}},
        {
            $facet: {
                docs: [{ $skip: (parseInt(page)-1) * parseInt(perpage) }, { $limit: parseInt(perpage) }],
                totalCount: [{
                    $count: 'count'
                }]
            }
        }
    ]).exec();

    
    if(result != null && result.length > 0){
        var totalCount = 0;
        if(Boolean(result[0].totalCount) && result[0].totalCount.length > 0)
            totalCount = result[0].totalCount[0].count;
        
        if(result[0].docs){
            for(var x=0;x< result[0].docs.length;x++){
                result[0].docs[x].desc = result[0].docs[x].certificate_no + " / "+ result[0].docs[x].nama_tertanggung + " / " + moment(result[0].docs[x].dob_tertanggung).format("DD MMM YYYY") ;
            }
        }

        return apihelper.APIResponseOK(res,true,"",{
            page:page,
            pages:Math.ceil(totalCount/perpage),
            total:totalCount,
            limit:perpage,
            docs:result[0].docs
        });    
    }else {
        return apihelper.APIResponseOK(res,true,"",undefined);
    }

}))

router.get("/detail/:id", apihelper.authAccessOr({
    IMPORTVOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete,
    IMPORTVOUCHERWALLETAPPROVE: config.action.View | config.action.Update  | config.action.Delete,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;

    var result = await ImportVoucher.aggregate([
        {$match : {_id:ObjectID(dataid)}},
        {$lookup: { 
            from: "admin",
            localField:"created_by",
            foreignField:"_id",
            as:"created_by_user"
        }}, 
        {$unwind: {
            "path": "$created_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "admin",
            localField:"approved_by",
            foreignField:"_id",
            as:"approved_by_user"
        }}, 
        {$unwind: {
            "path": "$approved_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        { $project: {'_id':1,'voucher_data':1,'status':1,'success_count':1,'failed_count':1,'created_at':1,"data":1,
                        'approved_at':1,'desc':1,'approved_by_user._id':1,'approved_by_user.name':1,'created_by_user._id':1,'created_by_user.name':1
        }}
    ]).exec();

    
    if(result != null && result.length > 0){
        return apihelper.APIResponseOK(res,true,"",result[0]);
    }else {
        return apihelper.APIResponseOK(res,false,"",undefined);
    }

}))




module.exports = router;