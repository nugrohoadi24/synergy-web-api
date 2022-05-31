const config = require('../config/config');
const router = require('express').Router();
const ImportUserPolicy = require('../models/ImportUserPolicy');
const strHelper = require('../helper/StringHelper');
const User = require('../models/User');
const UserPolicy = require('../models/UserPolicy');
const InsuranceProduct = require('../models/InsuranceProduct');
const CompanyPolicy = require('../models/CompanyPolicy');
const apihelper = require('../helper/APIHelper');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');

var busboy = require('connect-busboy')
var kue = require('kue')
const moment = require("moment");
var mime = require('mime');
const { exception } = require('console');

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

router.post("/upload", apihelper.authAccessOr({MPARTICIPANTUPLOAD:config.action.Create | config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {} = req.query;
    uploadedRecord = 0;
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.csv')){
            return apihelper.APIResponseErr(res,false,"File yg dapat di upload hanya CSV",null);
        }


        var fileAbsPath = config.uploadTempPath + '/import_user_policy/' + strHelper.generateRandom(30) + ".csv";
        fstream = fs.createWriteStream(fileAbsPath);
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename);
            queue.create("process_upload_user_policy", {
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

queue.process("process_upload_user_policy",async (job, done) => {
    console.log("File CSV uploaded at " + job.data.path );

    try{
        await ImportUserPolicy.collection.remove();
    }catch(ex){
        console.log(ex);
    }
    var bulk = ImportUserPolicy.collection.initializeOrderedBulkOp();    
    var counter = 0;
    var stream = fs.createReadStream(job.data.path) .pipe(csv.parse({ headers: true}))
    .on('error', error => {
        uploadStatus = "FAILED";
        uploadMessage = error;        
        console.log(error);    
    }).on('data',(row) => {
        row.nik_tertanggung = apihelper.cleanString(row.nik_tertanggung);
        row.policy_end_date = apihelper.cleanString(row.policy_end_date);
        row.policy_date = apihelper.cleanString(row.policy_date);
        row.dob_tertanggung = apihelper.cleanString(row.dob_tertanggung);

        row.user_id = apihelper.uppercaseString(row.user_id);
        row.certificate_no = apihelper.uppercaseString(row.certificate_no);
        row.nama_tertanggung = apihelper.uppercaseString(row.nama_tertanggung);
        row.relation = apihelper.uppercaseString(row.relation);
        row.nik_tertanggung = apihelper.uppercaseString(row.nik_tertanggung);
        row.card_no = apihelper.uppercaseString(row.card_no);

        row.status = "WAITING";
        row.status_message = "";
        row.created_at = moment().utc().toDate();
        row.updated_at = moment().utc().toDate();

        


        try{
            if(Boolean(row.dob_tertanggung))
                var tmp = moment.utc(row.dob_tertanggung,"DD/MM/YYYY")

            if(tmp.isValid() )
                row.dob_tertanggung = tmp.toDate();
            else{
                row.status = "FAILED";
                row.status_message = "Invalid dob_tertanggung date format, Should be DD/MM/YYYY";    
            }
        }catch(e){
            row.status = "FAILED";
            row.status_message = "Invalid dob_tertanggung format, Should be DD/MM/YYYY";
        }

        try{
            if(Boolean(row.policy_date))
                var tmp = moment.utc(row.policy_date,"DD/MM/YYYY")

            if(tmp.isValid() )
                row.policy_date = tmp.toDate();
            else{
                row.status = "FAILED";
                row.status_message = "Invalid policy_date date format, Should be DD/MM/YYYY";    
            }
        }catch(e){
            row.status = "FAILED";
            row.status_message = "Invalid policy_date format, Should be DD/MM/YYYY";
        }

        try{
            bulk.insert(row);
            counter++;
            if(counter%1000 === 0){
                counter = 0;
                stream.pause(); //lets stop reading from file until we finish writing this batch to db
                bulk.execute(function(err,result) {
                    if (err) throw err;   
                    bulk  = ImportUserPolicy.collection.initializeOrderedBulkOp();
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
            queue.create("process_data_userpolicy", {})
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

queue.process("process_data_userpolicy",async (job, done) => {
    try{
        uploadedRecord = 0;
        while(true){
            var result1 = await ImportUserPolicy.paginate({status:"WAITING"}, { 
                page: 1,
                limit: 1000,
                sort: "_id" 
            });

            if(!Boolean(result1) || !Boolean(result1.docs) || result1.docs.length <=0)
                break;
            
            uploadedRecord = 0;
            try{    
                var bulk = ImportUserPolicy.collection.initializeOrderedBulkOp();
                var bulkUserPolicy = UserPolicy.collection.initializeOrderedBulkOp();

                var uSet = new Set(result1.docs.map(x => x.product_code));
                var productData =await InsuranceProduct.find({code:{$in:[...uSet]}});
                
                var userData = await User.find({userId:{$in:result1.docs.map(x => new RegExp(x.user_id, 'i') )}});

                var companyPolicyData = await CompanyPolicy.find({policy_no:{$in:result1.docs.map(x => x.company_policy)}});
                
                
                var newUserPolicyData = [];

                if(result1.docs.length > 0 ){                    
                    result1.docs.forEach(async (dt) => {

                        var errMsg = "";
                        if(!Boolean(dt.certificate_no))
                            errMsg = "* No sertifikat tidak boleh kosong \n";

                        if(!Boolean(dt.user_id))
                            errMsg = "* userId tidak boleh kosong \n";

                        if(!Boolean(dt.nama_tertanggung))
                            errMsg = "* Nama tertanggung tidak boleh kosong \n";

                        if(!Boolean(dt.card_no))
                            errMsg = "* No Kartu tidak boleh kosong \n";

                        if(!Boolean(dt.product_type))
                            errMsg = "* Product type tidak boleh kosong"
                            
                        if(!Boolean(dt.gender_tertanggung))
                            errMsg = "* Gender tertanggung tidak boleh kosong \n";
                        else{
                            if(dt.gender_tertanggung != "F" && dt.gender_tertanggung != 'M')
                                errMsg = "* Gender tertanggung harus M untuk pria, F untuk wanita \n";
                        }

                        if(!Boolean(dt.dob_tertanggung))
                            errMsg = "* dob_tertanggung tidak boleh kosong \n";
                        else {
                            dt.dob_tertanggung = moment(dt.dob_tertanggung, "DD/MM/YYYY").toDate();
                        }
                                
                            
                        if(!Boolean(dt.policy_date))
                            errMsg = "* Tanggal polis tidak boleh kosong \n";
                        else {
                            dt.policy_date = moment(dt.policy_date, "DD/MM/YYYY").toDate();
                        }

                        if(Boolean(dt.nik_tertanggung)){
                            if(dt.nik_tertanggung.length !=16)
                                errMsg = "* NIK tertanggung harus 16 karakter \n";
                        // }else{
                        //     errMsg += "* Silahkan input NIK tetanggung\r\n";
                        }

                                                
                        var productDataTemp = null;
                        var planTemp = null;
                        if(!Boolean(dt.product_code)) {
                            errMsg = "* Product code tidak boleh kosong \n";
                        }else {
                            productDataTemp = productData.find(x=>x.code == dt.product_code)

                            if(apihelper.isEmptyObj(productDataTemp)) {
                                errMsg += "* Product Tidak di temukan kosong \n";
                            }else {
                                if(!Boolean(dt.plan_name)) {
                                    errMsg += "* Plan tidak boleh kosong \n";
                                }else {
                                    planTemp = productDataTemp.benefit_year_limit.find(x => x.plan_name == dt.plan_name);
                                    if(!Boolean (planTemp))
                                        errMsg += "* Plan tidak di temukan pada product\n";
                                }
                            }
                        }

                        

                        var companyPolicyTemp = null;
                        if(!Boolean(dt.company_policy)) {
                            errMsg = "* Company Policy tidak boleh kosong \n";
                        }else {
                            companyPolicyTemp = companyPolicyData.find(x=> x.policy_no == dt.company_policy)
                            if(apihelper.isEmptyObj(companyPolicyTemp)) {
                                errMsg += "* data Company Policy di temukan kosong \n";
                            }else {
                                if(Boolean(dt.policy_date)){
                                    if(moment(companyPolicyTemp.policy_date).utc().isAfter(moment.utc(dt.policy_date))){
                                        errMsg += "* Tanggal polis tidak boleh sebelum tanggal company polis " + moment(companyPolicyTemp.policy_date).format("DD/MM/YYYY") +"\n";
                                    }
                                }
                            }
                        }

                        if(Boolean(errMsg)) {
                            bulk.find( { _id: dt._id} ).update( { $set: { status: "FAILED",status_message:errMsg } } );                        
                        }else{
                            var user = userData.find(x=>x.userId.toUpperCase() == dt.user_id);
                            var productDataTemp = productData.find(x=>x.code == dt.product_code)    
                            if(Boolean(user)){                               
                                var policyDate = new moment(dt.policy_date);
                                var policyEndDate = new moment(companyPolicyTemp.policy_end_date);
                                var dobTertanggung = new moment(dt.dob_tertanggung);

                                var policyData = {  
                                    "user": user._id,
                                    "certificate_no":dt.certificate_no,
                                    "nama_tertanggung":dt.nama_tertanggung,
                                    "nik_tertanggung":dt.nik_tertanggung,
                                    "gender_tertanggung":dt.gender_tertanggung,
                                    "company_policy": companyPolicyTemp.policy_no,
                                    "policy_date":policyDate.toDate(),
                                    "policy_end_date":policyEndDate.toDate(),
                                    "dob_tertanggung":dobTertanggung.toDate(),
                                    "insurance_product":productDataTemp._id,
                                    "plan_name":dt.plan_name,
                                    "product_type":dt.product_type,
                                    "relation":dt.relation,
                                    "card_no":dt.card_no,
                                    "created_at":moment().utc().toDate(),
                                    "updated_at":moment().utc().toDate(),
                                    "yearly_usage":0,
                                    "benefit_usage":[],
                                    "yearly_claim_history":[],
                                    "monthly_period":null,
                                    "quarter_period":null,
                                    "semester_period":null,
                                    "is_used":false,
                                    "is_active":true,
                                    "upload_data_id":dt._id
                                };

                                policyData.monthly_period = [];
                                policyData.quarter_period = [];
                                
                                policyData.semester_period = [];
                                var quarterStartDate = policyDate.toDate();
                                var semesterStartDate = policyDate.toDate();
                                for(var month = 1;month<=12;month++){
                                    var endDate = null;
                                    if(month ==12)
                                        endDate =  policyDate.clone().add(month, 'months').toDate();                                      
                                    else
                                        endDate =   policyDate.clone().add(month, 'months').add(-1,"day").toDate();                                      
                                    
                                    
                                    var doexit = false;
                                    if(endDate > policyEndDate.toDate()){
                                        endDate = policyEndDate.clone().toDate();
                                        doexit = true;
                                    }

                                    var tmp1 = {
                                        period_start: policyDate.clone().add(month-1, 'months').toDate(),
                                        period_end: endDate
                                    };
                                    policyData.monthly_period.push(tmp1);


                                    if(month%3==0 || doexit){
                                        var tmp2 = {
                                            period_start: quarterStartDate,
                                            period_end: endDate
                                        };
                                        quarterStartDate = policyDate.clone().add(month, 'months').toDate();                                            
                                        policyData.quarter_period.push(tmp2);
                                    }
                                    if(month%6==0  || doexit){
                                        var tmp3 = {
                                            period_start: semesterStartDate,
                                            period_end: endDate
                                        };
                                        semesterStartDate = policyDate.clone().add(month, 'months').toDate();                                            
                                        policyData.semester_period.push(tmp3);
                                    }
                                
                                    if(doexit)
                                        break;
                                }

                                //bulkUserPolicy.insert(policyData);
                                newUserPolicyData.push(policyData);

                                uploadedRecord++;
                                haveOperation = true;
                            }else{
                                bulk.find( { _id: dt._id} ).update( { $set: { status: "FAILED",status_message:"user tidak di temukan" } } );                        
                            }    
                        }
                    }); 
    
                   

                    if(newUserPolicyData.length>0){
                        try{
                            //var result1 = await UserPolicy.insertMany(newUserPolicyData,{ ordered: false });
                            var result1 = await UserPolicy.insertMany(newUserPolicyData,{ordered: false,rawResult:true }).catch(ex => {
                                if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                                    for(var key in ex.writeErrors){
                                        var tmp = ex.writeErrors[key];
                                        newUserPolicyData[tmp.err.index].errormsg = tmp.errmsg
                                    }
                                }							
                            });        
                        } catch(ex){
                            if(Boolean(ex.writeErrors) && ex.writeErrors.length > 0){
                                for(var key in ex.writeErrors){
                                    var tmp = ex.writeErrors[key];
                                    newUserPolicyData[tmp.err.index].errormsg = tmp.errmsg
                                }
                            }
                        }
                        for(var key in newUserPolicyData){
                            var tmp  = newUserPolicyData[key];            
                            if(Boolean(tmp.errormsg) && tmp.errormsg.length > 0){
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "FAILED", policy_date: tmp.policy_date,  status_message:tmp.errormsg } 
                                } );
                            }else{
                                bulk.find( { _id: tmp.upload_data_id} ).update( 
                                    { $set: { status: "SUCCESS",policy_date: tmp.policy_date,  status_message:"Participant Telah Berhasil Di Upload." } 
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
                    // if(uploadedRecord>0){                        
                    //     await bulkUserPolicy.execute(function(err,result) {
                    //         if (err) {
                    //             console.log(err);
                    //             throw err;   
                    //         } 
                    //     });    
                    // }   
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


router.get("/upload/progress", apihelper.authAccessOr({MPARTICIPANTUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = {
        "uploadedRecord":uploadedRecord,
        "uploadStatus":uploadStatus,
        "uploadMessage":uploadMessage
    }
    return apihelper.APIResponseOK(res,true,"",data);
}))



router.get("/upload/status", apihelper.authAccessOr({MPARTICIPANTUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var dbData = await ImportUserPolicy.aggregate([
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



router.get("/download/failed", apihelper.authAccessOr({MPARTICIPANTUPLOAD:config.action.View}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const cursor = ImportUserPolicy.find({status:'FAILED'});
 
    const transformer = (doc)=> {
        return {
            user_id: doc.user_id,
            certificate_no: doc.certificate_no,
            policy_date: "'" + moment.utc(doc.policy_date).format("DD/MM/YYYY"),
            policy_end_date: "'" + moment.utc(doc.policy_end_date).format("DD/MM/YYYY"),
            nik_tertanggung: "'" + doc.nik_tertanggung,
            product_code: doc.product_code,
            plan_name: doc.plan_name,
            product_type: doc.product_type,
            nama_tertanggung: doc.nama_tertanggung,
            relation: doc.relation,
            status:doc.status_message
        };
    }

    const filename = 'failed_user_policy_' + moment().format("DD-MM-YYYY_HH_mm_ss") + '.csv';

    res.setHeader('Content-disposition', `attachment; filename=${filename}`);
    res.writeHead(200, { 'Content-Type': 'text/csv' });

    res.flushHeaders();
    var csvStream = csv.format({ headers: true }).transform(transformer);
    //var csvStream = csv.createWriteStream({headers: true}).transform(transformer)
    cursor.stream().pipe(csvStream).pipe(res);
}));



router.get("/template", apihelper.handleErrorAsync(async (req, res, next) => {
    var file =  './template/importPolis.csv';
    var filename = path.basename(file);
    var mimetype = mime.lookup(file);
  
    res.setHeader('Content-disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-type', mimetype);

    var filestream = fs.createReadStream(file);
    filestream.pipe(res);
}));

router.get("/", apihelper.authAccessOr({MPARTICIPANTUPLOAD:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,status} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({nama_tertanggung : q});
        finalQuery["$or"].push({user_id : q});
        finalQuery["$or"].push({relation : q});
        finalQuery["$or"].push({nik_tertanggung : q});
        finalQuery["$or"].push({plan_name : q});
        finalQuery["$or"].push({card_no : q});
        finalQuery["$or"].push({product_code : q});
    }

    if(Boolean(status)){
        finalQuery.status = status;
    }

    var result = ImportUserPolicy.paginate(finalQuery, { 
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