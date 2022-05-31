const config = require('../config/config');
const router = require('express').Router();
const ImporProvider = require('../models/ImportProvider');
const Hospital = require('../models/Hospital');

const Crypto = require('crypto');
const strHelper = require('../helper/StringHelper');
const apihelper = require('../helper/APIHelper');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
var ObjectID = require('mongodb').ObjectID;

var busboy = require('connect-busboy')
var kue = require('kue')
const moment = require("moment");
var mime = require('mime');
const { exception } = require('console');
const importProvider = require('../models/ImportProvider');

var queue = kue.createQueue({
    redis: {
      port: 6379,
      host: 'localhost',
      auth: config.redisPass
    }
  });
var uploadedRecord = 0;
var uploadMessage = "";
var uploadStatus = "";

router.post("/upload", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.Create | config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {} = req.query;
    uploadedRecord = 0;
    var fstream;

    var uploadPath = config.uploadTempPath + '/import_provider/'
    if(!fs.existsSync(uploadPath))
        fs.mkdirSync(uploadPath);

    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.csv')){
            return apihelper.APIResponseErr(res,false,"File yg dapat di upload hanya CSV",null);
        }


        var fileAbsPath = uploadPath + strHelper.generateRandom(30) + ".csv";

        fstream = fs.createWriteStream(fileAbsPath);
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename);
            queue.create("process_upload_provider_insert", {
                path: fileAbsPath
            }).on('complete', function(result){
                uploadStatus = "SUCCESS";
                uploadMessage = "success";
            }).on('failed attempt', function(errorMessage, doneAttempts){
                uploadStatus = "FAILED";
                uploadMessage = errorMessage;            
            }).on('failed', function(errorMessage){
                uploadStatus = "FAILED";
                uploadMessage = errorMessage;            
            }).on('progress', function(progress, data){
                uploadedRecord  = data.uploadedRecord;
            })
            .priority("high")
            .save();
        });
    });

    return apihelper.APIResponseOK(res,true,"",null);
}))

queue.process("process_upload_provider_insert",async (job, done) => {
    console.log("File CSV uploaded at " + job.data.path );

    try{
        await importProvider.collection.remove();
    }catch(ex){
        console.log(ex);
    }
    var bulk = importProvider.collection.initializeOrderedBulkOp();    
    var counter = 0;
    var stream = fs.createReadStream(job.data.path) .pipe(csv.parse({ headers: true }))
    .on('error', error => {
        uploadStatus = "FAILED";
        uploadMessage = error;        
        console.log(error);    
    }).on('data',(row) => {
        row.code = apihelper.cleanUppercaseString(row.code);
        row.type = apihelper.cleanUppercaseString(row.type);
        row.name = apihelper.cleanUppercaseString(row.name);
        row.address = apihelper.cleanUppercaseString(row.address);
        row.admin_email = apihelper.cleanUppercaseString(row.admin_email);
        row.province = apihelper.cleanUppercaseString(row.province);
        row.city = apihelper.cleanUppercaseString(row.city);
        row.district = apihelper.cleanUppercaseString(row.district);
        row.subdistrict = apihelper.cleanUppercaseString(row.subdistrict);
        row.zipcode = apihelper.cleanUppercaseString(row.zipcode);
        row.phone1 = apihelper.cleanUppercaseString(row.phone1);
        row.phone2 = apihelper.cleanUppercaseString(row.phone2);
        row.longitude = apihelper.cleanUppercaseString(row.longitude);
        row.latitude = apihelper.cleanUppercaseString(row.latitude);
        row.voucher_pin = apihelper.cleanUppercaseString(row.voucher_pin);
    
        row.status = "WAITING";
        row.status_message = "";
        row.created_at = moment().utc().toDate();
        row.updated_at = moment().utc().toDate();

    
        try{
            bulk.insert(row);
            counter++;
            if(counter%1000 === 0){
                counter = 0;
                stream.pause(); //lets stop reading from file until we finish writing this batch to db
                bulk.execute(function(err,result) {
                    if (err) throw err;   
                    bulk  = ImporProvider.collection.initializeOrderedBulkOp();
                    stream.resume();
                    uploadedRecord += 1000;
                    job.progress(uploadedRecord,100,{"uploadedRecord":uploadedRecord});
                });
            }
        }catch(ex ){
            console.log(ex);
            done();
        }
    }).on('end', async(rowCount) => {
        console.log("counter " + counter);
        try{
            if ( counter > 0 ) {
                bulk.execute(function(err,result) {
                    if (err) throw err;     
                    uploadedRecord += counter;
                    job.progress(uploadedRecord,uploadedRecord,{"uploadedRecord":uploadedRecord});
                });
            }
            uploadStatus = "SUCCESS";
            uploadMessage = "success";
            console.log(`Parsed ${rowCount} rows`)
    
            uploadedRecord = 0;
            queue.create("process_upload_provider", {})
            .on('complete', function(result){
                uploadStatus = "SUCCESS";
                uploadMessage = "Data process success";
            }).on('failed attempt', function(errorMessage, doneAttempts){
                uploadStatus = "FAILED";
                uploadMessage = errorMessage;            
            }).on('failed', function(errorMessage){
                uploadStatus = "FAILED";
                uploadMessage = errorMessage;            
            }).on('progress', function(progress, data){
                uploadedRecord  = data.uploadedRecord;
            })
            .priority("high")
            .save();
        }catch(exc){
            console.log(exc);
        }
        console.log("Finished Upload");
        done();
    });    
});



queue.process("process_upload_provider",async (job, done) => {
    try{
        uploadedRecord = 0;
        while(true){

            var uploadedImportData = await importProvider.aggregate([
                {$match : {status:'WAITING'}},
                {$limit : 1000 },
                {$lookup: { 
                    from: "province",
                    localField:"province",
                    foreignField:"code",
                    as:"province_data"
                }},
                {$lookup: { 
                    from: "city",
                    localField:"city",
                    foreignField:"code",
                    as:"city_data"
                }},
                {$lookup: { 
                    from: "district",
                    localField:"district",
                    foreignField:"code",
                    as:"district_data"
                }},
                {$lookup: { 
                    from: "subdistrict",
                    localField:"subdistrict",
                    foreignField:"code",
                    as:"subdistrict_data"
                }},
                {$lookup: { 
                    from: "hospital",
                    localField:"code",
                    foreignField:"code",
                    as:"hospital_data"
                }}
            ]);

            if(!Boolean(uploadedImportData) || uploadedImportData.length <=0)
                break;

            uploadedRecord = 0;
            try{    
                var bulk = importProvider.collection.initializeOrderedBulkOp();                
                var newData = [];
                var updateData = [];
                var haveOperation = false;

                if(uploadedImportData.length > 0 ){                    
                    uploadedImportData.forEach(async (dataItem) => {

                        var errMsg = "";
                        var provinceDataId = undefined;
                        if(!Boolean(dataItem.type)){
                            errMsg += "* type tidak boleh kosong \n";
                        }else{
                            if(!['INSURANCE','RS','KLINIK','LAB','APOTEK','OPTIK'].includes(dataItem.type))
                                errMsg += "* type salah, tidak di dukung \n";                        
                        }

                        if(!Boolean(dataItem.address)){
                            errMsg += "* address tidak boleh kosong \n";
                        }

                        if(!Boolean(dataItem.name)){
                            errMsg += "* name tidak boleh kosong \n";
                        }

                        if(!Boolean(dataItem.code)){
                            errMsg += "* code tidak boleh kosong \n";
                        }
                        
                        if(Boolean(dataItem.province)){
                            if((!Boolean(dataItem.province_data) || dataItem.province_data.length == 0) )
                                errMsg += "* Kode Provinsi salah \n";
                            else
                                provinceDataId = dataItem.province_data[0]._id;
                        }else{
                            errMsg += "* Kode Provinsi tidak boleh kosong \n";
                        }
    
                        var cityDataId = undefined;
                        if(Boolean(dataItem.city) ){
                            if((!Boolean(dataItem.city_data) || dataItem.city_data.length == 0) )
                                errMsg += "* Kode city salah \n";
                            else
                                cityDataId = dataItem.city_data[0]._id;
                        }else{
                            errMsg += "* Kode city tidak boleh kosong \n";
                        }
    
                        var districtDataId = undefined;
                        if(Boolean(dataItem.district)){
                            if((!Boolean(dataItem.district_data) || dataItem.district_data.length == 0) )
                                errMsg += "* Kode district salah \n";
                            else
                                districtDataId = dataItem.district_data[0]._id;
                        }else{
                            errMsg += "* Kode district tidak boleh kosong \n";
                        }

                        var subdistrictDataId = undefined;
                        if(Boolean(dataItem.subdistrict) ){
                            if((!Boolean(dataItem.subdistrict_data) || dataItem.subdistrict_data.length == 0) ){
                                errMsg += "* Kode subdistrict salah \n";
                            }   
                            else
                                subdistrictDataId = dataItem.subdistrict_data[0]._id;
                        }else{
                            errMsg += "* Kode subdistrict tidak boleh kosong \n";
                        }

                        if(Boolean(errMsg)) {
                            bulk.find( { _id: dataItem._id} ).update( { $set: { status: "FAILED",status_message:errMsg } } );                                                    
                            haveOperation = true;
                        }else{
                            var tobeProcessData = {
                                "type": dataItem.type,
                                "code": dataItem.code,
                                "admin_email": dataItem.admin_email,
                                "name": dataItem.name,
                                "address": dataItem.address,
                                "province": provinceDataId,
                                "city": cityDataId,
                                "district": districtDataId,
                                "subdistrict": subdistrictDataId,
                                "zipcode": dataItem.zipcode,
                                "qrcode":  Crypto.randomBytes(50).toString('base64').slice(0, 50) + dataItem.code,
                                "phone1": dataItem.phone1,
                                "phone2": dataItem.phone2,
                                "longitude": dataItem.longitude,
                                "latitude": dataItem.latitude,
                                "voucher_pin": dataItem.voucher_pin,
                                "is_active": true,
                                "upload_data_id":dataItem._id
                            }

                            //data telah ada sebelumnya                            
                            if((!Boolean(dataItem.hospital_data) || dataItem.hospital_data.length == 0)){
                                newData.push(tobeProcessData);
                            }else{
                                tobeProcessData._id = dataItem.hospital_data[0]._id;
                                updateData.push(tobeProcessData);
                            }    
                            uploadedRecord++;
                        }
                    }); 
    
                   
                    if(newData.length>0){
                        try{
                            //var result1 = await UserPolicy.insertMany(newUserPolicyData,{ ordered: false });
                            var result1 = await Hospital.insertMany(newData,{ordered: false,rawResult:true }).catch(ex => {
                                if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                                    for(var key in ex.writeErrors){
                                        var tmp = ex.writeErrors[key];
                                        newData[tmp.err.index].errormsg = tmp.errmsg
                                    }
                                }							
                            });        
                            console.log(result1);
                        } catch(ex){
                            if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                                for(var key in ex.writeErrors){
                                    var tmp = ex.writeErrors[key];
                                    newData[tmp.err.index].errormsg = tmp.errmsg
                                }
                            }
                        }

                        for(var key in newData){
                            var tmp  = newData[key];            
                            haveOperation = true;                            
                            if(Boolean(tmp.errormsg) && tmp.errormsg.length > 0){
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "FAILED", status_message:tmp.errormsg } 
                                } );
                            }else{
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "SUCCESS", status_message:"Data inserted" } 
                                } );    
                            }
                        }
                        
                    }


                    if(updateData.length>0){
                        try{
                            var bulkupdate = Hospital.collection.initializeOrderedBulkOp();                
                            for(var key in updateData){
                                var data = updateData[key];
                                bulkupdate.find({ _id: data._id}).update({ $set: data} );
                            }
                            await bulkupdate.execute(function(err,result) {
                                if (err) {
                                    console.log(err);
                                    throw err;   
                                } 
                            });  
                        } catch(ex){
                            console.log(ex);
                        }              

                        for(var key in updateData){
                            var tmp  = updateData[key];            
                            haveOperation = true;                            
                            if(Boolean(tmp.errormsg) && tmp.errormsg.length > 0){
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "FAILED", status_message:tmp.errormsg } 
                                } );
                            }else{
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "SUCCESS", status_message:"Data Updated" } 
                                } );    
                            }
                        }          
                    }

                    if(haveOperation){
                        await bulk.execute(function(err,result) {
                            if (err) {
                                console.log(err);
                                throw err;   
                            } 
                        });    
                    }
                }else{
                    break;
                } 
            } catch(ex){
                console.log("Exception => ");
                console.log(ex);
                throw ex;   
            }
        }
    }catch(ex ){
        console.log(ex);
    }
    done();
})


router.get("/upload/progress", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = {
        "uploadedRecord":uploadedRecord,
        "uploadStatus":uploadStatus,
        "uploadMessage":uploadMessage
    }
    return apihelper.APIResponseOK(res,true,"",data);
}))



router.get("/upload/status", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var dbData = await importProvider.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]).exec();

    var data = {
        "waiting":0,
        "success":0,
        "failed":0,
        "uploaded":0
    }

    
    if(Boolean(dbData)){
        dbData.forEach(x => {
            if(x._id == 'FAILED')
                data.failed = x.count;
            else if(x._id == 'SUCCESS')
                data.success = x.count;
            else if(x._id == 'WAITING')
                data.waiting = x.count;
        });
        data.uploaded = data.failed + data.waiting + data.success;
    }

    return apihelper.APIResponseOK(res,true,"",data);
}))



router.get("/download/failed", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.View}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const cursor = importProvider.find({status:'FAILED'});
 
    const transformer = (doc)=> {
        return {
            type: doc.type,
            code: doc.code,
            name: doc.name,
            address: doc.address,
            province: doc.province,
            city: doc.city,
            district: doc.district,
            subdistrict: doc.subdistrict,
            admin_email: doc.admin_email,
            zipcode: doc.zipcode,
            phone1: doc.phone1,
            phone2: doc.phone2,
            longitude: doc.longitude,
            latitude: doc.latitude,
            voucher_pin: doc.voucher_pin,
            status:doc.status_message
        };
    }

    const filename = 'failed_provider_' + moment().format("DD-MM-YYYY_HH_mm_ss") + '.csv';

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.writeHead(200, { 'Content-Type': 'text/csv' });

    res.flushHeaders();
    var csvStream = csv.format({ headers: true }).transform(transformer);
    //var csvStream = csv.createWriteStream({headers: true}).transform(transformer)
    cursor.stream().pipe(csvStream).pipe(res);
}));



router.get("/template", apihelper.handleErrorAsync(async (req, res, next) => {
    var file =  './template/importProvider.csv';
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);
  
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
}));

router.get("/", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,status} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({name : q});
        finalQuery["$or"].push({code : q});
    }

    if(Boolean(status)){
        finalQuery.status = status;
    }

    var result = importProvider.paginate(finalQuery, { 
        select: "",
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))

router.get("/detail/:id", apihelper.authAccessOr({MIMPORTPROVIDER:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;
  
    var data = await importProvider.aggregate([
        {$match : {_id: ObjectID(dataid)}},
        {$lookup: { 
            from: "province",
            localField:"province",
            foreignField:"code",
            as:"province_data"
        }},
        {$lookup: { 
            from: "city",
            localField:"city",
            foreignField:"code",
            as:"city_data"
        }},
        {$lookup: { 
            from: "district",
            localField:"district",
            foreignField:"code",
            as:"district_data"
        }},
        {$lookup: { 
            from: "subdistrict",
            localField:"subdistrict",
            foreignField:"code",
            as:"subdistrict_data"
        }}
    ]);

    if(Boolean(data) && data.length>0) {
        var temp = data[0];
        if(Boolean(temp.province_data) && temp.province_data.length>0)
            temp.province_data = temp.province_data[0];
            
        if(Boolean(temp.city_data) && temp.city_data.length>0)
            temp.city_data = temp.city_data[0];

        if(Boolean(temp.district_data) && temp.district_data.length>0)
            temp.district_data = temp.district_data[0];

        if(Boolean(temp.subdistrict_data) && temp.subdistrict_data.length>0)
            temp.subdistrict_data = temp.subdistrict_data[0];

        return apihelper.APIResponseOK(res,true,"",temp);

    }
    else
        return apihelper.APIResponseOK(res,false,"No data",0);

}))

module.exports = router;
