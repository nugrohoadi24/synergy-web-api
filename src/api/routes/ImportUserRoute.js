const config = require('../config/config');
const strHelper = require('../helper/StringHelper');
const router = require('express').Router();
const ImportUser = require('../models/ImportUser');
const User = require('../models/User');
const Company = require('../models/Company');
const crypto = require("crypto");
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const Subdistrict = require('../models/Subdistrict');


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

router.post("/upload",  apihelper.authAccessOr({MUSERUPLOAD:config.action.Create | config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {file} = req.query;
    console.log("Request Called " + file);
    uploadedRecord = 0;
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.csv')){
            return apihelper.APIResponseErr(res,false,"File yg dapat di upload hanya CSV",null);
        }

        console.log("New file uploaed");
        //Path where image will be uploaded
        var fileAbsPath = config.uploadTempPath + '/import_user/' + strHelper.generateRandom(30) + ".csv";

        fstream = fs.createWriteStream(fileAbsPath);
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename);

            queue.create("procesUpload", {
                path: fileAbsPath
            }).on('complete', function(result){
                uploadStatus = "WAITING_PROCESS";
                uploadMessage = "waiting file to process";
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

queue.process("procesUpload",async (job, done) => {
    console.log("File CSV uploaded at " + job.data.path );

    try{
        await ImportUser.collection.remove();
    }catch(ex){
    }

    var bulk = ImportUser.collection.initializeOrderedBulkOp();
    
    var counter = 0;
    var stream = fs.createReadStream(job.data.path) .pipe(csv.parse({ headers: true }))
    .on('error', error => {
        uploadStatus = "FAILED";
        uploadMessage = error;            
    }).on('data',(row) => {
        row.phone = apihelper.cleanString(row.phone);
        row.handphone = apihelper.cleanString(row.handphone);
        row.nik = apihelper.cleanString(row.nik);
        row.dob = apihelper.cleanString(row.dob);

        row.nama = apihelper.uppercaseString(row.nama);
        row.email = apihelper.uppercaseString(row.email);
        row.userId = apihelper.uppercaseString(row.userId);
        row.nik = apihelper.uppercaseString(row.nik);
        row.address = apihelper.uppercaseString(row.address);


        console.log("row.dob ");
        console.log(row.dob);

        row.status = "WAITING";
        row.status_message = "";
        try{
            if(Boolean(row.dob))
                var tmp = moment.utc(row.dob,"DD/MM/YYYY")

            if(tmp.isValid() )
                row.dob = tmp.toDate();
            else{
                row.status = "FAILED";
                row.status_message = "Invalid date format, Should be DD/MM/YYYY";    
            }
        }catch(e){
            row.status = "FAILED";
            row.status_message = "Invalid date format, Should be DD/MM/YYYY";
        }

        row.created_at = moment().utc().toDate();
        row.updated_at = moment().utc().toDate();


        bulk.insert(row);
        counter++;

        if(counter%1000 === 0){
            counter = 0;
            stream.pause(); //lets stop reading from file until we finish writing this batch to db
            bulk.execute(function(err,result) {
                if (err) throw err;   
                bulk  = ImportUser.collection.initializeOrderedBulkOp();
                stream.resume();
                uploadedRecord += 1000;
                job.progress(uploadedRecord,100,{"uploadedRecord":uploadedRecord});
            });
        }
    })
    .on('end', async(rowCount) => {
        try{
            if ( counter > 0 ) {
                bulk.execute(function(err,result) {
                    if (err) throw err;     
                    uploadedRecord += counter;
                    job.progress(uploadedRecord,uploadedRecord,{"uploadedRecord":uploadedRecord});
                });
            }
            uploadStatus = "SUCCESS";
            uploadMessage = "Success upload";
            console.log(`Parsed ${rowCount} rows`)

            uploadedRecord = 0;
            queue.create("process_data_user", {

            }).on('complete', function(result){
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

queue.process("process_data_user",async (job, done) => {
    try{
        uploadedRecord = 0;
        while(true){
            var result1 = await ImportUser.paginate({status:"WAITING"}, { 
                page: 1, 
                limit: 1000,
                sort: "_id" 
            });
    
            if(!Boolean(result1) || !Boolean(result1.docs) || result1.docs.length <=0)
                break;
    
            uploadedRecord = 0;
            try{
                var bulk = ImportUser.collection.initializeOrderedBulkOp();
                var bulkUser = User.collection.initializeOrderedBulkOp();
                var uSet = new Set(result1.docs.map(x => x.company));
                var dataComp = await Company.find({code:{$in:[...uSet]}});
                var dataUser = await User.find({userId:{$in:result1.docs.map(x => x.userId)}});
                var provinceList = await Province.find().exec();
                var cityList = await City.find().exec();
                var districtList = await District.find().exec();
                var subdistrictList = await Subdistrict.find().exec();
    
                var newUserData = [];

                for(var key in result1.docs) {
                    dt = result1.docs[key];

                    var errMsg = "";
                    if(!Boolean(dt.userId))
                        errMsg = "* User Id harus di isi \n";

                    if(!Boolean(dt.nama))
                        errMsg = "* Nama tidak boleh kosong \n";

                    if(!Boolean(dt.password))
                        errMsg = "* password tidak boleh kosong \n";
                    
                    if(Boolean(dt.nik)){
                        if(dt.nik.length !=16)
                            errMsg = "* NIK harus 16 karakter \n";
                    }else{
                        dt.nik = null;
                    }
                    
                    if(Boolean(dt.gender)) {
                        if(dt.gender!= "F" && dt.gender != 'M')
                            errMsg = "* gender harus M untuk pria, F untuk wanita \n";
                    }else{
                        dt.gender = null;
                    }
                    

                    dt.address_complete  = dt.address;

                    if(Boolean(dt.province)){
                        var provinceData = provinceList.find(x => x.code == dt.province);    
                        if(!Boolean(provinceData)){
                            errMsg = "* Kode provinsi tidak ditemukan \n";
                        }else{
                            dt.province = provinceData.code;
                            dt.address_complete = dt.address_complete + " PROV " + provinceData.name; 
                        }
                    }else{
                        dt.province = null;
                    }

                    if(Boolean(dt.city)){
                        var cityData = cityList.find(x => x.code == dt.city);    
                        if(!Boolean(cityData)){
                            errMsg = "* Kode provinsi tidak ditemukan \n";
                        }else{
                            dt.city = cityData.code;
                            dt.address_complete = dt.address_complete + " KOTA " + cityData.name; 
                        }
                    }else{
                        dt.city = null;
                    }

                    if(Boolean(dt.district)){
                        var districtData = districtList.find(x => x.code == dt.district);    
                        if(!Boolean(districtData)){
                            errMsg = "* Kode Kecamatan tidak ditemukan \n";
                        }else{
                            dt.district = districtData.code;
                            dt.address_complete = dt.address_complete + " KECAMATAN " + districtData.name; 
                        }
                    }else{
                        dt.district = null;
                    }

                    if(Boolean(dt.subdistrict)){
                        var subdistrictData = subdistrictList.find(x => x.code == dt.subdistrict);    
                        if(!Boolean(subdistrictData)){
                            errMsg = "* Kode Kelurahan tidak ditemukan \n";
                        }else{
                            dt.subdistrict = subdistrictData.code;
                            dt.address_complete = dt.address_complete + " KELURAHAN " + subdistrictData.name; 
                        }
                    }else{
                        dt.subdistrict = null;
                    }

                    if(Boolean(errMsg)) {
                        bulk.find( { _id: dt._id} ).update( { $set: { status: "FAILED",status_message:errMsg } } );                        
                    } else {
                        var user = dataUser.find(x=>x.userId == dt.userId);

                        if(!Boolean(user)){
                            var dataCompTemp = dataComp.find(x=>x.code == dt.company)
                            if((Boolean(dt.company) && Boolean(dataCompTemp)) || (!Boolean(dt.company))){
                                var dob = null;
                                if(Boolean(dt.dob))
                                    dob = new moment(dt.dob,"DD/MM/YYYY").toDate();;

                                console.log(dob);
                                var password = crypto.createHash("sha256").update(dt.password).digest("hex");

                                user = {
                                    "userId": dt.userId,
                                    "nama": dt.nama,
                                    "email":dt.email,
                                    "phone":dt.phone,
                                    "handphone":dt.handphone,
                                    "nik": dt.nik,
                                    "password": password,
                                    "dob": dob,
                                    "gender":dt.gender,
                                    "bank_acc_no":dt.bank_acc_no,
                                    "bank_name":dt.bank_name,
                                    "bank_account_name":dt.bank_account_name,
                                    "company":(Boolean(dataCompTemp)?dataCompTemp._id:null),
                                    "address":dt.address,
                                    "province":dt.province,
                                    "city":dt.city,
                                    "district":dt.district,
                                    "subdistrict":dt.subdistrict,
                                    "is_active":true,
                                    "created_at": moment().utc().toDate(),
                                    "updated_at": moment().utc().toDate(),
                                    "upload_data_id":dt._id
                                }
                                newUserData.push(user);

                                //bulkUser.insert(user);
                                uploadedRecord++;
                                //bulk.find( { _id: dt._id} ).update( { $set: { status: "SUCCESS",status_message:"success" } } );
                            }else {
                                bulk.find( { _id: dt._id} ).update( { $set: { status: "FAILED",status_message:"data perusahaan tidak di temukan" } } );
                            }
                        }else{
                            bulk.find( { _id: dt._id} ).update( { $set: { status: "FAILED",status_message:"user telah ada" } } );
                        }
                    }
                };

                if(newUserData.length>0){
                    try{
                        var result1 = await User.insertMany(newUserData,{ordered: false,rawResult:true }).catch(ex => {
							if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
								for(var key in ex.writeErrors){
									var tmp = ex.writeErrors[key];
									newUserData[tmp.err.index].errormsg = tmp.errmsg
								}
							}							
						});
                        //var result1 = await User.create(newUserData);
                    } catch(ex){

                        if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                            for(var key in ex.writeErrors){
                                var tmp = ex.writeErrors[key];
                                newUserData[tmp.err.index].errormsg = tmp.errmsg
                            }
                        }
                    }
                    
                    for(var key in newUserData){
                        var tmp  = newUserData[key];            
                        if(Boolean(tmp.errormsg) && tmp.errormsg.length > 0){
                            bulk.find( { _id: tmp.upload_data_id} ).update( 
                                { $set: { status: "FAILED", status_message:tmp.errormsg } 
                            } );
                        }else{
                            bulk.find( { _id: tmp.upload_data_id} ).update( 
                                { $set: { status: "SUCCESS", status_message:"success" } 
                            } );    
                        }
                    }
                    
                }

                await bulk.execute(function(err,result) {
                    if (err) {
                        console.log(err);
                        throw err;   
                    } 
                });

                console.log(" uploadedRecord " + uploadedRecord);
                /*if(uploadedRecord>0){
                    await bulkUser.execute(function(err,result) {
                        if (err) {
                            console.log(err);
                            throw err;   
                        } 
                    });    
                } */
                
                
            } catch(ex){
                console.log(ex);
                throw ex;
            }

        }
    }catch(Ex ){

    }
    done();
})

router.get("/upload/progress", apihelper.authAccessOr({MUSERUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = {
        "uploadedRecord":uploadedRecord,
        "uploadStatus":uploadStatus,
        "uploadMessage":uploadMessage
    }
    return apihelper.APIResponseOK(res,true,"",data);
}))

router.get("/upload/status", apihelper.authAccessOr({MUSERUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var dbData = await ImportUser.aggregate([
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

router.get("/download/failed", apihelper.authAccessOr({MUSERUPLOAD:config.action.View}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
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
    var file =  './template/ImportUser.csv';
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);
  
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
}));

router.get("/", apihelper.authAccessOr({MUSERUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,status} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    if(Boolean(status)){
        finalQuery.status = status;
    }

    var result = ImportUser.paginate(finalQuery, { 
        select: "",
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))

module.exports = router;