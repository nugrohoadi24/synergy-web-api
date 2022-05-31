const config = require('../config/config');
const strHelper = require('../helper/StringHelper');
const router = require('express').Router();

const Admin = require('../models/Admin');
const User = require('../models/User');
const InsuranceProduct = require('../models/InsuranceProduct');
const UserPolicy = require('../models/UserPolicy');
const UserClaim = require('../models/UserClaim');
const HospitalSchema = require('../models/Hospital');
const CounterSchema = require('../models/Counter');
const ClaimLimitOptionSchema = require('../models/ClaimLimitOption');
const DiagnoseSchema = require('../models/Diagnose');
const History = require('../models/History');
var ObjectID = require('mongodb').ObjectID;


var mongoose = require('mongoose');
const moment = require('moment');
var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');
var mime = require('mime');


const apihelper = require('../helper/APIHelper');
const e = require('express');

router.get("/", apihelper.authAccessOr({
    CLAIM:config.action.View,
    CLAIMPROCESS:config.action.View,
}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,type,sb,sd,status} = req.query;
    
    var finalQuery = {};
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({nama_tertanggung:q});
        finalQuery["$or"].push({sjm_file_name:q});
        finalQuery["$or"].push({user_name:q});
        finalQuery["$or"].push({card_no:q});
        finalQuery["$or"].push({user_id:q});
        finalQuery["$or"].push({certificate_no:q});
        finalQuery["$or"].push({claim_no:q});
    }

    if(Boolean(status)){
        finalQuery.claim_status = status;        
    }

    if(String(type) == "insurance"){
        finalQuery.requester_product_type = "2"
    }
    else if(String(type) == "salvus_care"){
        finalQuery.requester_product_type ="1"
    }

    var result = UserClaim.paginate(finalQuery, { 
        select: "_id user_name user_id card_no policy claim_no user request_claim_date claim_total_amount covered_total_amount excess_total_amount claim_status policy nama_tertanggung cashless requester_product_type insurance_product_reject_note created_at updated_at",
        populate: { path: 'user policy', select: '_id code email nama certificate_no nama_tertanggung dob_tertanggung' },
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

router.get("/claimmethod", apihelper.authAccessOr({
    CLAIM:config.action.View,
    CLAIMPROCESS:config.action.View,
}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd,status, cashless} = req.query;
    
    var finalQuery = {};
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({user_name:q});
        finalQuery["$or"].push({card_no:q});
        finalQuery["$or"].push({user_id:q});
        finalQuery["$or"].push({certificate_no:q});
        finalQuery["$or"].push({claim_no:q});
    }

    if(Boolean(status)){
        finalQuery.claim_status = status;        
    }

    if(Boolean(cashless)){
        finalQuery.cashless = cashless;        
    }

    var result = UserClaim.paginate(finalQuery, { 
        select: "_id user_name user_id card_no policy claim_no user request_claim_date claim_total_amount covered_total_amount excess_total_amount claim_status policy cashless created_at updated_at",
        populate: { path: 'user policy', select: '_id code email nama certificate_no nama_tertanggung dob_tertanggung' },
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

router.get("/detail/:id", apihelper.authAccessOr({
    CLAIM:config.action.View,
    CLAIMPROCESS:config.action.View,
}), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",null);

    claim.policy = await UserPolicy.findOne({_id:claim.policy},'_id user certificate_no nama_tertanggung insurance_product nik_tertanggung dob_tertanggung plan_name').lean().exec();
    if(apihelper.isEmptyObj(claim.policy))
        return apihelper.APIResponseOK(res,false,"Detail Polis Claim tidak ditemukan",null);
    claim.policy.desc = claim.policy.certificate_no + " / " + claim.policy.nama_tertanggung;


    claim.user = await User.findOne({_id:claim.user},'_id nama').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail Usre Claim tidak ditemukan",null);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",null);
    
    if(!apihelper.isEmptyObj(claim.diagnose)){
        claim.diagnose = await DiagnoseSchema.findOne({_id:claim.diagnose},'_id code name').lean().exec();
        if(apihelper.isEmptyObj(claim.diagnose))
            return apihelper.APIResponseOK(res,false,"Pilihan Diagnosa tidak ditemukan",null);    
    }


    
    if(!apihelper.isEmptyObj(claim.surat_jaminan_masuk_by)){
        claim.surat_jaminan_masuk_by = await Admin.findOne({_id:claim.surat_jaminan_masuk_by},'_id name').lean().exec();
    }

    if(!apihelper.isEmptyObj(claim.surat_jaminan_masuk_sent_by)){
        claim.surat_jaminan_masuk_sent_by = await Admin.findOne({_id:claim.surat_jaminan_masuk_sent_by},'_id name').lean().exec();
    }

    if(!apihelper.isEmptyObj(claim.surat_jaminan_keluar_by)){
        claim.surat_jaminan_keluar_by = await Admin.findOne({_id:claim.surat_jaminan_keluar_by},'_id name').lean().exec();
    }

    if(!apihelper.isEmptyObj(claim.surat_jaminan_keluar_sent_by)){
        claim.surat_jaminan_keluar_sent_by = await Admin.findOne({_id:claim.surat_jaminan_keluar_sent_by},'_id name').lean().exec();
    }

    if(Boolean(claim.updated_by))
        claim.updated_by = await Admin.findOne({_id: claim.updated_by},"_id name").exec();

    if(Boolean(claim.created_by))
        claim.created_by = await Admin.findOne({_id: claim.created_by},"_id name").exec();




    if(!apihelper.isEmptyObj(claim.policy_benefit_detail)){
        var insuranceProduct = await InsuranceProduct.findOne({_id:claim.policy.insurance_product}).lean().exec();
        if(apihelper.isEmptyObj(insuranceProduct))
            return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
        
        for (var x = 0;x< insuranceProduct.benefit.length;x++) {
            var benefit = insuranceProduct.benefit[x];
            if(benefit.is_group)
                continue;
            var usageHistory = claim.policy_benefit_detail.find(us => {return us._id.toString() == benefit._id.toString()});
            benefit.plan =  benefit.plan.find(y => y.plan_name == claim.policy.plan_name);
            benefit.unit_price_limit = benefit.plan.unit_price_limit;
            benefit.unit_name = benefit.unit_name;            
            benefit.plan = undefined;

            if(Boolean(usageHistory)){
                benefit.usage1 = usageHistory.usage1;                
                benefit.usage2 = usageHistory.usage2;
            }
        }
        claim.policy_benefit_detail = insuranceProduct.benefit;
    }
    return apihelper.APIResponseOK(res,true,"",claim); 
}))


router.get("/inprogress", apihelper.authAccessOr({
    CLAIM:config.action.View,
    CLAIMPROCESS:config.action.View,
}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const {policyId} = req.query;
    
    var waitingProcessClaimList = await UserClaim.aggregate([
        {$match:{ 
            policy_id: mongoose.Types.ObjectId(policyId),
            claim_status:'NEW'
        }},
        {$unwind:{path: "$claim"}},
        {$group: { 
                _id: "$claim.benefit", 
                totalClaim: {$sum: 1},
                totalAmount: {$sum: "$claim.claim_total_amount"},
                totalJumlah: {$sum: "$claim.claim_jumlah"}
            }
        }
    ]).exec();

    return apihelper.APIResponseOK(res,true,"",waitingProcessClaimList);
}))

var funcCreateClaim =  apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    if(apihelper.isEmptyObj(data.policy))
        errmsg += "* Silahkan input polis yg akan di claim \r\n";

    if(apihelper.isEmptyObj(data.hospital))
        errmsg += "* Silahkan input rumah sakit yg akan di claim \r\n";

    if(apihelper.isEmptyObj(data.requester_name))
        errmsg += "* Silahkan Nama Pengaju Claim yg akan di claim \r\n";

    if(apihelper.isEmptyObj(data.requester_nik))
        errmsg += "* Silahkan NIK Pengaju Claim yg akan di claim \r\n";

    if(apihelper.isEmptyObj(data.requester_phone))
        errmsg += "* Silahkan Phone/WA Pengaju Claim yg akan di claim \r\n";


    if(apihelper.isEmptyObj(data.cashless))
        data.cashless = false;
    
    if(apihelper.isEmptyObj(errmsg)){
        var saveData = {};
        saveData._id = data._id;
        if(Boolean(saveData._id)) {
            var existingData = await UserClaim.findOne({_id:saveData._id}).exec();
            if(Boolean(existingData)){
                if(existingData.claim_status != "CREATED")
                    return apihelper.APIResponseOK(res, true,"Tidak dapat mengupdate data, status telah bukan Created",undefined);
            }
        }

                
        saveData.created_by = req.user;        
        saveData.hospital = data.hospital;
        saveData.cashless = data.cashless;

        if(data.cashless == false && data.claim_status == "CREATED"){
            saveData.claim_status = "CLAIM_DETAIL";
        }else{
            saveData.claim_status = "CREATED";
        }
        
        saveData.request_claim_date = moment.utc();
        saveData.accident_description = data.accident_description;
        saveData.claim_reason = data.claim_reason;
        saveData.requester_name = data.requester_name;
        saveData.requester_phone = data.requester_phone;
        saveData.requester_email = data.requester_email;
        saveData.requester_relation = data.requester_relation;
        saveData.requester_nik = data.requester_nik;
        saveData.request_claim_note = data.request_claim_note;
        saveData.requester_product_type = data.requester_product_type;
        saveData.nama_tertanggung = data.nama_tertanggung;
        saveData.incident_date = data.incident_date;
        saveData.incident_body_part_injured = data.incident_body_part_injured;


        saveData.policy = await UserPolicy.findOne({_id:data.policy._id});

        if(!Boolean(data._id)){
            //validasi claim double
            var existingData = await UserClaim.count({
                policy : data.policy._id,
                user : saveData.policy.user,
                claim_status: {$in:[
                    config.claim_status.CREATED,
                    config.claim_status.PROCESSED,
                    config.claim_status.SJM_CREATED,
                    config.claim_status.SJM_SENT,
                    config.claim_status.CLAIM_DETAIL
                ]}
            }).exec();

            if(existingData > 0){
                return apihelper.APIResponseOK(res, false, "Silahkan selesaikan claim yg sebelumnya, masih terdapat claim yg belum melewati status 'Processed",undefined);
            }
        }
        

        if(!Boolean(saveData.policy))
            return apihelper.APIResponseOK(res, false, "data polis  tidak di temukan, silahkan cek kembali data anda\r\n",undefined);
                    
        saveData.user = await User.findOne({_id:saveData.policy.user});
        if(!Boolean(saveData.policy))
            return apihelper.APIResponseOK(res, false, "User tidak di temukan, silahkan cek kembali data anda\r\n",undefined);

        saveData.product_id = saveData.policy.insurance_product;        
        var insuranceProduct = await InsuranceProduct.findOne({_id:saveData.product_id});

        if(!Boolean(insuranceProduct))
            return apihelper.APIResponseOK(res, false, "Silahkan cek kembali data polis anda, product tidak di temukan",undefined);                    
        
        saveData.user_id = saveData.user.userId;
        saveData.user_name = saveData.user.nama;
        saveData.card_no = saveData.policy.card_no;

        
        saveData.claim_total_amount=0;        
        saveData.covered_total_amount=0;        
        saveData.excess_total_amount=0;

        saveData.company_policy = saveData.policy.company_policy;
        saveData.insurance_product_name = insuranceProduct.name;
        saveData.insurance_product_type = insuranceProduct.type;
        saveData.insurance_product_plan_name = saveData.policy.plan_name;
        saveData.insurance_product_reject_note = "-";

        if(!Boolean(saveData.claim_no)){
            /*Update no surat perkiraan biaya*/
            var cdate = moment().utc().format('YYYY-MM');
            
            var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_CLAIM},
            [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

            saveData.claim_no =  ("CLM" + apihelper.getMonthYear() + apihelper.paddingZero(counter.value,5));
        }

        if(saveData._id) {
            saveData.updated_by = req.user;
            saveData.updated_at = moment().utc().toDate();        
            var result = await UserClaim.findByIdAndUpdate({_id:saveData._id},saveData,{
                upsert:true
            }).exec();                   
        }else{
            saveData.created_at = moment().utc().toDate();        
            saveData.created_by = req.user;
            var result = await UserClaim.create(saveData);

            await History.create({
                title:"KLAIM NO " + saveData.claim_no + ": " + config.claim_status_text.CREATED,
                description : "KLAIM NO " + saveData.claim_no + ": " + config.claim_status_text.CREATED,
                type : "CLAIM",
                user : saveData.user,
                created_at : moment().utc().toDate(),
                created_by : req.user
            });
        }

        saveData.policy.is_used = true;
        await saveData.policy.save();
        
        return apihelper.APIResponseOK(res, true,"",{
            _id: result._id
        });
    }else{
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }
})

router.put("/create", apihelper.authAccessOr({CLAIM:config.action.Create}), funcCreateClaim)

router.post("/create", apihelper.authAccessOr({CLAIM:config.action.Update}), funcCreateClaim)


router.put("/process/:id", apihelper.authAccessOr({CLAIMPROCESS:config.action.Create | config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id= req.params.id;
    const data = req.body;

    var finalQuery = {_id:id}

    if(apihelper.isEmptyObj(data.doctor_name))
        return apihelper.APIResponseOK(res, false, "Silahkan isi nama dokter",undefined);

    if(apihelper.isEmptyObj(data.diagnose_note))
        return apihelper.APIResponseOK(res, false, "Silahkan isi note diagnosa",undefined);

    if(apihelper.isEmptyObj(data.diagnose))
        return apihelper.APIResponseOK(res, false, "Silahkan masukan diagnosa",undefined);

    if(apihelper.isEmptyObj(data.claim))
        return apihelper.APIResponseOK(res, false, "Silahkan masukan data claim",undefined);

    if(apihelper.isEmptyObj(data.discharge_date))
        errmsg += "* Silahkan isi discharge date date \r\n";

    if(apihelper.isEmptyObj(data.admission_date))
        errmsg += "* Silahkan isi admission date \r\n";


    var createdClaim = await UserClaim.findOne(finalQuery).lean().exec();    
 
    if(apihelper.isEmptyObj(createdClaim))
        return apihelper.APIResponseOK(res, false, "Data Claim tidak di temukan",undefined);

    if(!(createdClaim.claim_status == "SJM_SENT" || createdClaim.claim_status == "CLAIM_DETAIL"))
        return apihelper.APIResponseOK(res, false, "Detail klaim TIDAK BISA DIUBAH setelah Anda submit. ANDA YAKIN?",undefined);
    
    var currentDate = moment().startOf('day').utc().toDate();

    var policyData = await UserPolicy.findOne({_id:createdClaim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);

    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    insuranceProduct.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);

    createdClaim.doctor_name = data.doctor_name;
    createdClaim.diagnose_note = data.diagnose_note;
    createdClaim.diagnose = data.diagnose;
    createdClaim.admission_date = data.admission_date;
    createdClaim.discharge_date = data.discharge_date; 

    createdClaim.claim = [];
    createdClaim.claim_status = "PROCESSED";

    if(apihelper.isEmptyObj(createdClaim.processsed_date)){
        createdClaim.processsed_date = currentDate;
        createdClaim.processed_by = req.user;    
    }
    
    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit;

    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    for (var x = 0;x< insuranceProduct.benefit.length;x++) {
        var benefit = insuranceProduct.benefit[x];
        if(!Boolean(benefit.is_group)){
            benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);
            benefit.limit1 = satuan_limit_data.find(s=> s.key == benefit.plan.limit1Type);
            benefit.limit2 = satuan_limit_data.find(s=> s.key == benefit.plan.limit2Type);
        }
    }

    //createdClaim.policy_benefit_detail=  [];
    //createdClaim.yearly_usage = 0;

    // capture data usage ke policy
    for (var x = 0;x< insuranceProduct.benefit.length;x++) {
        var benefit = insuranceProduct.benefit[x];

        benefit.usage1 = {
            value:null,
            availableValue:null,
            limitValue:null,
            valueType:null,
            durationType:null,
        };
        benefit.usage2 = {
            value:null,
            availableValue:null,
            limitValue:null,
            valueType:null,
            durationType:null
        };

        if(!Boolean(benefit.is_group)){
            if(!(benefit.plan.limit1Type == "99" || benefit.plan.limit2Type == "99")){
                /#CApture data pemakaian saat claim terjadi#/
                if(Boolean(policyData.benefit_usage)){                    
                    var benefitUsage = policyData.benefit_usage.find(us => us.benefit.toString()== benefit._id.toString() );
                    if(Boolean(benefitUsage)){
                        var tmp = benefitUsage.usage1.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);

                        if(!apihelper.isEmptyObj(tmp)){
                            benefit.usage1.valueType = tmp.usage_valueType;
                            benefit.usage1.durationType = tmp.usage_durationType;
                            
                            tmp.usage_jlh = 0;
                            tmp.usage_amount = 0;
                            tmp.claim_history.filter(function(value, index, arr){ 
                                return value.claim.toString() != createdClaim._id.toString()
                            }).forEach(element => {
                                tmp.usage_jlh += element.usage_jlh;
                                tmp.usage_amount += element.usage_amount;
                            });;

                            if(benefit.usage1.valueType == config.limit_value_type.Unit)
                                benefit.usage1.value = tmp.usage_jlh;
                            else if (benefit.usage1.valueType == config.limit_value_type.Amount)
                                benefit.usage1.value = tmp.usage_amount;
                            else if (benefit.usage1.valueType == config.limit_value_type.Claim)
                                benefit.usage1.value = 1;
                            else if (benefit.usage1.valueType == config.limit_value_type.AsClaim)
                                benefit.usage1.value = tmp.usage_amount;
                        }

                        var tmp2 = benefitUsage.usage2.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate)
                        if(!apihelper.isEmptyObj(tmp2)){
                            benefit.usage2.valueType = tmp2.usage_valueType;
                            benefit.usage2.durationType = tmp2.usage_durationType;                            

                            tmp2.usage_jlh = 0;
                            tmp2.usage_amount = 0;
                            tmp2.claim_history.filter(function(value, index, arr){ 
                                return value.claim.toString() != createdClaim._id.toString()
                            }).forEach(element => {
                                tmp2.usage_jlh += element.usage_jlh;
                                tmp2.usage_amount += element.usage_amount;
                            });;

                            if(benefit.usage2.valueType == config.limit_value_type.Unit)
                                benefit.usage2.value = tmp2.usage_jlh;
                            else if (benefit.usage2.valueType == config.limit_value_type.Amount)
                                benefit.usage2.value = tmp2.usage_amount;
                            else if (benefit.usage2.valueType == config.limit_value_type.Claim)
                                benefit.usage2.value = 1;
                            else if (benefit.usage2.valueType == config.limit_value_type.AsClaim)
                                benefit.usage2.value = tmp2.usage_amount;                            
                        }
                    }
                }


                var telahAdaUnlimited = false;
                if(Boolean(benefit.limit1)){
                    benefit.usage1.valueType = benefit.limit1.valueType;
                    benefit.usage1.durationType = benefit.limit1.durationType;
                    if(benefit.limit1.valueType == config.limit_value_type.AsClaim) {
                        //unlimeted claim                    
                        //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                        benefit.usage1.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                        benefit.usage1.limitValue = policyData.benefit_year_limit.limit;
                        telahAdaUnlimited = true;
                    }else{
                        benefit.usage1.availableValue = benefit.plan.limit1 - benefit.usage1.value;
                        benefit.usage1.limitValue = benefit.plan.limit1;
                    }
                }

                if(Boolean(benefit.limit2)){
                    benefit.usage2.valueType = benefit.limit2.valueType;
                    benefit.usage2.durationType = benefit.limit2.durationType;
                    if(benefit.limit2.valueType == config.limit_value_type.AsClaim) {
                        //unlimeted claim                    
                        //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                        if(telahAdaUnlimited) {
                            benefit.usage2.availableValue = null; // tidak perlu di munculkan limit yg sama 2 kali
                            benefit.usage2.limitValue = null;
                            benefit.usage2.value= null;
                        } else {
                            benefit.usage2.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                            benefit.usage2.limitValue = policyData.benefit_year_limit.limit;
                        }
                    }else {
                        benefit.usage2.availableValue = benefit.plan.limit2 - benefit.usage2.value;
                        benefit.usage2.limitValue = benefit.plan.limit2;
                    }
                }   


                /#Copy data claim ke policy#/
                var claimData = data.claim.find(dc=> dc.benefit.toString()  == benefit._id.toString() );
                if(!apihelper.isEmptyObj(claimData)) {
                    if(benefit.unit == "1"){ //input type 1, dimana yg diinput hanya amount
                        claimData.claim_jumlah = 1;
                        claimData.covered_jumlah = 1;
                    }

                    var benefitUsage = null;
                    if(apihelper.isEmptyObj(policyData.benefit_usage)){
                        policyData.benefit_usage = [];
                        benefitUsage = {
                            benefit:benefit._id,
                            usage1:[],
                            usage2:[]
                        };
                        policyData.benefit_usage.push(benefitUsage);
                    }else{
                        benefitUsage =  policyData.benefit_usage.find(bu=> bu.benefit.toString() == benefit._id.toString() );
                        if(apihelper.isEmptyObj(benefitUsage)){
                            benefitUsage = {
                                benefit:benefit._id,
                                usage1:[],
                                usage2:[]
                            };
                            policyData.benefit_usage.push(benefitUsage);
                        }
                    }
                    benefitUsage.last_claim_date = currentDate;

                    var usage1temp = benefitUsage.usage1.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);                    
                    if(apihelper.isEmptyObj(usage1temp)){
                        usage1temp = initUsage(policyData,benefit.limit1.valueType,benefit.limit1.durationType,currentDate);
                        benefitUsage.usage1.push(usage1temp);
                    }else{
                        usage1temp.claim_history = usage1temp.claim_history.filter(function(value, index, arr){ 
                            return value.claim.toString() != createdClaim._id.toString()
                        });
                    }

                    usage1temp.claim_history.push({
                        claim:createdClaim._id,
                        usage_amount:claimData.covered_amount,
                        usage_jlh:claimData.covered_jumlah
                    });

                    usage1temp.usage_amount = 0;
                    usage1temp.usage_jlh = 0;
                    usage1temp.claim_count = 0;
                    usage1temp.usage_by_type = 0;

                    for(var counter=0;counter<usage1temp.claim_history.length;counter++){                        
                        usage1temp.usage_amount += usage1temp.claim_history[counter].usage_amount;
                        usage1temp.usage_jlh += usage1temp.claim_history[counter].usage_jlh;
                        usage1temp.claim_count += 1;
                    }
                    if(usage1temp.usage_valueType == config.limit_value_type.Amount)
                        usage1temp.usage_by_type = usage1temp.usage_amount;
                    else if(usage1temp.usage_valueType == config.limit_value_type.Unit)
                        usage1temp.usage_by_type = usage1temp.usage_jlh;
                    else if(usage1temp.usage_valueType == config.limit_value_type.Claim)
                        usage1temp.usage_by_type = usage1temp.claim_count;


                    var usage2temp = benefitUsage.usage2.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);
                    if(apihelper.isEmptyObj(usage2temp)){
                        usage2temp = initUsage(policyData,benefit.limit2.valueType,benefit.limit2.durationType,currentDate);
                        benefitUsage.usage2.push(usage2temp);
                    }else {
                        usage2temp.claim_history = usage2temp.claim_history.filter(function(value, index, arr){ 
                            return value.claim.toString() != createdClaim._id.toString()
                        });
                    }

                    usage2temp.claim_history.push({
                        claim:createdClaim._id,
                        usage_amount:claimData.covered_amount,
                        usage_jlh:claimData.covered_jumlah
                    });

                    usage2temp.usage_amount = 0;
                    usage2temp.usage_jlh = 0;
                    usage2temp.claim_count = 0;
                    usage2temp.usage_by_type = 0;

                    for(var counter=0;counter<usage2temp.claim_history.length;counter++){                        
                        usage2temp.usage_amount += usage2temp.claim_history[counter].usage_amount;
                        usage2temp.usage_jlh += usage2temp.claim_history[counter].usage_jlh;
                        usage2temp.claim_count += 1;    
                    }

                    if(usage2temp.usage_valueType == config.limit_value_type.Amount)
                        usage2temp.usage_by_type = usage2temp.usage_amount;
                    else if(usage2temp.usage_valueType == config.limit_value_type.Unit)
                        usage2temp.usage_by_type = usage2temp.usage_jlh;
                    else if(usage2temp.usage_valueType == config.limit_value_type.Claim)
                        usage2temp.usage_by_type = usage2temp.claim_count;
                    

                    createdClaim.claim.push(claimData);

                    //Kalkulasi yearly usage
                    if(!Boolean(policyData.yearly_claim_history)){
                        policyData.yearly_claim_history = [];
                    }else{
                        policyData.yearly_claim_history = policyData.yearly_claim_history.filter(
                            function(value, index, arr){ 
                                return !(
                                    value.claim.toString() == createdClaim._id.toString() && 
                                    value.benefit.toString() == benefit._id.toString()  
                                );
                        });
                    }

                    policyData.yearly_claim_history.push({
                        claim:createdClaim._id,
                        benefit:benefit._id,
                        usage_amount:claimData.covered_amount,
                        usage_jlh:claimData.covered_jumlah
                    });

                    policyData.yearly_usage = 0;       
                    for(var counter=0;counter<policyData.yearly_claim_history.length;counter++){
                        policyData.yearly_usage += policyData.yearly_claim_history[counter].usage_amount; 
                        /*capture yearly usage tanpa claim yg saat ini di proses*/
//                        if(policyData.yearly_claim_history[counter].claim.toString() == createdClaim._id.toString())
//                            createdClaim.yearly_usage += policyData.yearly_claim_history[counter].usage_amount;
                    }

                    if(usage1temp.usage_valueType == config.limit_value_type.AsClaim)
                        usage1temp.usage_by_type = policyData.yearly_usage;

                    if(usage2temp.usage_valueType == config.limit_value_type.AsClaim)
                        usage2temp.usage_by_type = policyData.yearly_usage;
                }
            }else{
                benefit.usage1.availableValue = null;
            }
        }        
        benefit.plan = undefined;
        benefit.benefit = benefit._id;
        //##createdClaim.policy_benefit_detail.push(benefit);
    }
     
    //##createdClaim.yearly_usage_limit = createdClaim.yearly_usage_limit - createdClaim.yearly_usage;
    createdClaim.claim_total_amount = 0;
    createdClaim.covered_total_amount = 0;
    createdClaim.excess_total_amount = 0;

    for (var key in createdClaim.claim){        
        var tm = createdClaim.claim[key];
        createdClaim.claim_total_amount += tm.claim_amount;
        createdClaim.covered_total_amount += tm.covered_amount;
    }


    if(createdClaim.claim_total_amount > createdClaim.covered_total_amount)
        createdClaim.excess_total_amount = createdClaim.claim_total_amount - createdClaim.covered_total_amount;

    if(insuranceProduct.benefit_year_limit.limit < policyData.yearly_usage){
        return apihelper.APIResponseOK(res,false,"Jumlah claim melebihi sisa limit tahunan " + apihelper.formatThousandGroup(insuranceProduct.benefit_year_limit.limit));    
    }

    const session = await mongoose.startSession();

    try{
        await UserPolicy.findByIdAndUpdate({_id: policyData._id},policyData,{
            upsert:true
        }).exec();    

        await UserClaim.findByIdAndUpdate(finalQuery,createdClaim,{
            upsert:true
        }).exec();        

        await History.create({
            title:"KLAIM NO " + createdClaim.claim_no + ": " + config.claim_status_text.PROCESSED,
            description : "KLAIM NO " + createdClaim.claim_no + ": " + config.claim_status_text.PROCESSED,
            type : "CLAIM",
            user : createdClaim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });

        return apihelper.APIResponseOK(res,true,"Sukses");    
    }catch(ex){
        session.endSession();
        return apihelper.APIResponseOK(res,false,ex.message,null);    
    }

}))

function initUsage(policyData,valueType,durationType,currentDate){
    var usagetemp = {
        usage_amount:0,
        usage_jlh:0,
        claim_count:0,
        claim_history:[]
    };
    usagetemp.usage_durationType = durationType;
    usagetemp.usage_valueType = valueType;

    if(durationType == "day"){
        usagetemp.period_start = currentDate;
        usagetemp.period_end = currentDate;
    }else if(durationType == "month"){
        var period = policyData.monthly_period.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);
        usagetemp.period_start = period.period_start;
        usagetemp.period_end = period.period_end;
    }else if(durationType == "quarter"){
        var period = policyData.quarter_period.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);
        usagetemp.period_start = period.period_start;
        usagetemp.period_end = period.period_end;
    }else if(durationType == "semester"){
        var period = policyData.semester_period.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);
        usagetemp.period_start = period.period_start;
        usagetemp.period_end = period.period_end;
    }else if(durationType == "year"){
        usagetemp.period_start = policyData.policy_date;
        usagetemp.period_end = policyData.policy_end_date;
    }else{
        usagetemp.period_start = policyData.policy_date;
        usagetemp.period_end = policyData.policy_end_date;
    }
    return usagetemp;
}

/*
router.put("/",authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    if(!Boolean(data.policy))
        errmsg += "* Silahkan input polis yg akan di claim \r\n";

    if(!Boolean(data.hospital))
        errmsg += "* Silahkan input rumah sakit yg akan di claim \r\n";

    if(!Boolean(data.doctor_name))
        errmsg += "* Silahkan input nama dokter \r\n";

    if(!Boolean(data.diagnose_note))
        errmsg += "* Silahkan note diagnosa \r\n";

    if(!Boolean(data.diagnose))
        errmsg += "* Silahkan input  diagnosa \r\n";

    if(!Boolean(data.claim))
        errmsg += "* Silahkan masukan data claim \r\n";

    if(!Boolean(data.cashless))
        errmsg += "* Silahkan tipe claim \r\n";

    data.claim_status = "CREATED";
    data.checked_by = null;
    data.checked_date = null;
    data.claim_date = moment.utc();
    data.claim_no = strHelper.generateRandom(20);

    if(!Boolean(errmsg)){
        var userPolicyData = await UserPolicy.findOne({_id:data.policy._id});
        if(!Boolean(userPolicyData))
            return apihelper.APIResponseOK(res, false, "data polis  tidak di temukan, silahkan cek kembali data anda\r\n",undefined);
                    
        var userData = await User.findOne({_id:userPolicyData.user});
        if(!Boolean(userData))
            return apihelper.APIResponseOK(res, false, "User tidak di temukan, silahkan cek kembali data anda\r\n",undefined);

        data.user = userData;

        data.product_id = userPolicyData.insurance_product;                
        var insuranceProduct = await InsuranceProduct.findOne({_id:data.product_id});

        var limitOptionData = await ClaimLimitOptionSchema.find({});

        if(!Boolean(insuranceProduct))
            return apihelper.APIResponseOK(res, false, "Silahkan cek kembali data polis anda, product tidak di temukan",undefined);                    
    


        data.claim_total_amount=0;       

        for(claimItemKey in data.claim)    
        {
            var claimItem = data.claim[claimItemKey];
            var benefitLimit = insuranceProduct.benefit.find(x=> x._id==claimItem.benefit);            

             if(!Boolean(benefitLimit))
                return apihelper.APIResponseOK(res, false, "Silahkan cek kembali data polis anda, benefit tidak di temukan pada product ",undefined);                    

            claimItem.benefit_name = benefitLimit.name;
            if(Boolean(benefitLimit)){
                var planLimit = benefitLimit.plan.find(x=> x.plan_name == userPolicyData.plan_name);
                
                if(Boolean(planLimit)){           
                    if(planLimit.limit1Type == '99' || planLimit.limit2Type == '99')
                        return apihelper.APIResponseOK(res, false, "Maaf untuk benefit ini tidak tersedia di plan " +userPolicyData.plan_name ,undefined);                    

                    
                    var limitDetail1 = limitOptionData.find(lod=> lod.key == planLimit.limit1Type);
                    var limitDetail2 = limitOptionData.find(lod=> lod.key == planLimit.limit2Type);
                    
                    var benefitUsage = userPolicyData.benefit_usage.find(us => us.benefit==claimItem.benefit);
                    var waitingProcessClaim = waitingProcessClaimList.find(us => us._id==claimItem.benefit);

                    var totalUsage1 = 0;
                    var usageByDuration = null;
                    if(Boolean(benefitUsage)){
                        if(limitDetail1.durationType == "day"){
                            usageByDuration = benefitUsage.daily.find(xs => xs.period_start == data.claim_date);
                        }else if(limitDetail1.durationType == "month"){                            
                            usageByDuration = benefitUsage.monthly.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail1.durationType == "year"){
                            usageByDuration = benefitUsage.yearly.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail1.durationType == "quarter"){
                            usageByDuration = benefitUsage.quarter.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail1.durationType == "semester"){
                            usageByDuration = benefitUsage.semester.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }
                    }

                    if(Boolean(usageByDuration)){
                        if(limitDetail1.valueType == "Claim"){
                            totalUsage1 = 1 + usageByDuration.claim_count;
                        }else if (limitDetail1.valueType == "kali"){
                            totalUsage1 = claimItem.claim_jumlah + usageByDuration.usage_jlh;
                        }else if (limitDetail1.valueType == "Rupiah"){
                            totalUsage1 = (claimItem.claim_jumlah * claimItem.claim_amount) + usageByDuration.usage_amount;
                        }    
                    }else{
                        if(limitDetail1.valueType == "Claim"){
                            totalUsage1 = 1;
                        }else if (limitDetail1.valueType == "kali"){
                            totalUsage1 = claimItem.claim_jumlah;
                        }else if (limitDetail1.valueType == "Rupiah"){
                            totalUsage1 = (claimItem.claim_jumlah * claimItem.claim_amount);
                        }  
                    }

                    if(Boolean(waitingProcessClaim)){
                        if(limitDetail1.valueType == "Claim"){
                            totalUsage1 += waitingProcessClaim.totalClaim;
                        }else if (limitDetail1.valueType == "kali"){
                            totalUsage1 = waitingProcessClaim.totalJumlah;
                        }else if (limitDetail1.valueType == "Rupiah"){
                            totalUsage1 += waitingProcessClaim.totalAmount;
                        }  
                    }

                    

                    //######################### Filter 2#######################

                    var totalUsage2 = 0;
                    var usageByDuration2 = null;
                    if(Boolean(benefitUsage)){
                        if(limitDetail2.durationType == "day"){
                            usageByDuration2 = benefitUsage.daily.find(xs => xs.period_start == data.claim_date);
                        }else if(limitDetail2.durationType == "month"){                            
                            usageByDuration2 = benefitUsage.monthly.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail2.durationType == "year"){
                            usageByDuration2 = benefitUsage.yearly.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail2.durationType == "quarter"){
                            usageByDuration2 = benefitUsage.quarter.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }else if(limitDetail2.durationType == "semester"){
                            usageByDuration2 = benefitUsage.semester.find(xs => xs.period_start <= data.claim_date && xs.period_end >= data.claim_date);
                        }
                    }

                    if(Boolean(usageByDuration2)){
                        if(limitDetail2.valueType == "Claim"){
                            totalUsage2 = 1 + usageByDuration2.claim_count;
                        }else if (limitDetail2.valueType == "kali"){
                            totalUsage2 = claimItem.claim_jumlah + usageByDuration2.usage_jlh;
                        }else if (limitDetail2.valueType == "Rupiah"){
                            totalUsage2 = (claimItem.claim_jumlah * claimItem.claim_amount) + usageByDuration2.usage_amount;
                        }    
                    }else{
                        if(limitDetail2.valueType == "Claim"){
                            totalUsage2 = 1;
                        }else if (limitDetail2.valueType == "kali"){
                            totalUsage2 = claimItem.claim_jumlah;
                        }else if (limitDetail2.valueType == "Rupiah"){
                            totalUsage2 = (claimItem.claim_jumlah * claimItem.claim_amount);
                        }  
                    }

                    if(Boolean(waitingProcessClaim)){
                        if(limitDetail1.valueType == "Claim"){
                            totalUsage2 += waitingProcessClaim.totalClaim;
                        }else if (limitDetail1.valueType == "kali"){
                            totalUsage2 = waitingProcessClaim.totalJumlah;
                        }else if (limitDetail1.valueType == "Rupiah"){
                            totalUsage2 += waitingProcessClaim.totalAmount;
                        }  
                    }

                   

                    claimItem.claim_total_amount = claimItem.claim_jumlah * claimItem.claim_amount;
                    data.claim_total_amount += claimItem.claim_total_amount;

                }else{
                    return apihelper.APIResponseOK(res, false, "Plan tidak di temukan, silahkan cek kembali data anda",undefined);                    
                }

            }else{
                return apihelper.APIResponseOK(res, false, "benefit tidak di temukan, silahkan cek kembali data anda",undefined);                    
            }
        };
                
        if(data._id) {
            var result = await UserClaim.findByIdAndUpdate({_id:data._id}, data,{
                upsert:true
            }).exec();        
        }else{
            var result = await UserClaim.create(data);
        }
    
        return apihelper.APIResponseOK(res, true,"",undefined);

    }else{
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }
})) */

router.post("/sent_sjm/:id", apihelper.authAccessOr({CLAIM:config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    //kirim surat jaminan masuk
    const id = req.params.id;
    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",claim);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name admin_email').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",claim);

    claim.policy = await UserPolicy.findOne({_id:claim.policy},'_id nama_tertanggung nik_tertanggung').lean().exec();
    if(apihelper.isEmptyObj(claim.policy))
        return apihelper.APIResponseOK(res,false,"Detail Polis Claim tidak ditemukan",claim);


    if(!Boolean(claim.hospital.admin_email))
        return apihelper.APIResponseOK(res,false,"Silahkan set terlebih dahulu email dari admin Provider di menu Service Provider",claim);
            
    
    if(claim.claim_status == 'SJM_CREATED') {
        claim.claim_status = 'SJM_SENT';
        claim.surat_jaminan_masuk_sent_by = req.user;
        claim.surat_jaminan_masuk_sent_at = moment().utc().toDate();
        //await claim.save();
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();     
        
        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SJM_SENT,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SJM_SENT,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }

    var tmp = moment(claim.request_claim_date);
    var attachment = [
        {
            filename: claim.sjm_file_name,
            path: config.pdfPath + claim.sjm_file_name
        }
    ]

    var html = fs.readFileSync('./html/JaminanMasukEmail.html', 'utf8');

    html = html.replaceAll("#nosurat#",claim.surat_jaminan_masuk_no);
    html = html.replaceAll("#tanggalrequest#",moment(claim.surat_jaminan_masuk_at).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#rsname#",claim.hospital.name);
    html = html.replaceAll("#namatertanggung#",claim.policy.nama_tertanggung);
    html = html.replaceAll("#niktertanggung#",claim.policy.nik_tertanggung);
        
    var emailSubject = "SURAT JAMINAN MASUK-" + claim.hospital.name + "-" + claim.policy.nama_tertanggung + "-" + moment(claim.surat_jaminan_masuk_at).format("DD MMM yyyy").toUpperCase()    
    var resultEmail = await apihelper.sendEmail(claim.hospital.admin_email,emailSubject,html,attachment);    

    return apihelper.APIResponseOK(res,true,"Data telah di kirim ke email "+ claim.hospital.admin_email);
}))

router.get("/create_surat_jam/:id",  apihelper.authAccessOr({CLAIM:config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    //Surat jaminan masuk
    const id = req.params.id;

    var finalQuery = {_id:id}
    var currentDate = moment().startOf('day').utc().toDate();

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",undefined);

    var policyData = await UserPolicy.findOne({_id:claim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
    
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    claim.user = await User.findOne({_id:claim.user},'_id nama userId').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail User Claim tidak ditemukan",undefined);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",undefined);

    console.log("SJM File " + config.pdfPath + claim.sjm_file_name);
    if(!apihelper.isEmptyObj(claim.sjm_file_name)){
        if(fs.existsSync(config.pdfPath + claim.sjm_file_name)) {
            var filename = path.basename(config.pdfPath + claim.sjm_file_name);
            var mimetype = mime.lookup(config.pdfPath + claim.sjm_file_name);
          
            res.setHeader('Content-disposition', 'attachment; filename=' + claim.sjm_file_name);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(config.pdfPath + claim.sjm_file_name);
            filestream.pipe(res);
            return;
        }    
    }

    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);

    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    for (var x = 0;x< insuranceProduct.benefit.length;x++) {
        var benefit = insuranceProduct.benefit[x];
        if(!Boolean(benefit.is_group)){
            benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);
            benefit.limit1 = satuan_limit_data.find(s=> s.key == benefit.plan.limit1Type);
            benefit.limit2 = satuan_limit_data.find(s=> s.key == benefit.plan.limit2Type);
        }
    }

    claim.yearly_usage =0;

    // capture data usage ke policy
    //isi benefit usage
    if(apihelper.isEmptyObj(claim.policy_benefit_detail)){
        claim.policy_benefit_detail = [];
        for (var x = 0;x< insuranceProduct.benefit.length;x++) {
            var benefit = insuranceProduct.benefit[x];
            benefit.usage1 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null,
            };
            benefit.usage2 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null
            };

            if(!Boolean(benefit.is_group)){
                if(Boolean(policyData.benefit_usage)){
                    var benefitUsage = policyData.benefit_usage.find(us => us.benefit.toString()== benefit._id.toString() );

                    if(Boolean(benefitUsage)){
                        benefit.unit_price_limit = benefit.plan.unit_price_limit;
                        benefit.unit_name = benefit.unit_name;    

                        var tmp = benefitUsage.usage1.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);

                        if(!apihelper.isEmptyObj(tmp)){                            
                            benefit.usage1.valueType = tmp.usage_valueType;
                            benefit.usage1.durationType = tmp.usage_durationType;

                            if(benefit.usage1.valueType == config.limit_value_type.Unit)
                                benefit.usage1.value = tmp.usage_jlh;
                            else if (benefit.usage1.valueType == config.limit_value_type.Amount)
                                benefit.usage1.value = tmp.usage_amount;
                            else if (benefit.usage1.valueType == config.limit_value_type.Claim)
                                benefit.usage1.value = 1;
                            else if (benefit.usage1.valueType == config.limit_value_type.AsClaim)
                                benefit.usage1.value = tmp.usage_amount;
                        }

                        var tmp2 = benefitUsage.usage2.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate)
                        if(!apihelper.isEmptyObj(tmp2)){
                            benefit.usage2.valueType = tmp2.usage_valueType;
                            benefit.usage2.durationType = tmp2.usage_durationType;      

                            if(benefit.usage2.valueType == config.limit_value_type.Unit)
                                benefit.usage2.value = tmp2.usage_jlh;
                            else if (benefit.usage2.valueType == config.limit_value_type.Amount)
                                benefit.usage2.value = tmp2.usage_amount;
                            else if (benefit.usage2.valueType == config.limit_value_type.Claim)
                                benefit.usage2.value = 1;
                            else if (benefit.usage2.valueType == config.limit_value_type.AsClaim)
                                benefit.usage2.value = tmp2.usage_amount;
                        }
                    }
                }

                if(benefit.unit == "2" && Boolean(benefit.plan.unit_price_limit)){
                    benefit.unit_price_limit = benefit.plan.unit_price_limit;
                    benefit.unit_name = benefit.unit_name;
                }

                if(benefit.plan.limit1Type == "99" || benefit.plan.limit2Type == "99"){
                    benefit.usage1.availableValue = null;
                } else {
                    var telahAdaUnlimited = false;
                    benefit.unit_price_limit = benefit.plan.unit_price_limit;
                    benefit.unit_name = benefit.unit_name;
                    
                    if(Boolean(benefit.limit1)){
                        benefit.usage1.valueType = benefit.limit1.valueType;
                        benefit.usage1.durationType = benefit.limit1.durationType;
                        benefit.usage1.unit_price_limit = benefit.limit1.unit_price_limit;

                        if(benefit.limit1.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            benefit.usage1.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                            benefit.usage1.limitValue = policyData.benefit_year_limit.limit;
                            telahAdaUnlimited = true;
                        }else{
                            benefit.usage1.availableValue = benefit.plan.limit1 - benefit.usage1.value;
                            benefit.usage1.limitValue = benefit.plan.limit1;
                        }
                    }

                    if(Boolean(benefit.limit2)){
                        benefit.usage2.valueType = benefit.limit2.valueType;
                        benefit.usage2.durationType = benefit.limit2.durationType;
                        benefit.usage2.unit_price_limit = benefit.limit2.unit_price_limit;
                        
                        if(benefit.limit2.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            if(telahAdaUnlimited) {
                                benefit.usage2.availableValue = null; // tidak perlu di munculkan limit yg sama 2 kali
                                benefit.usage2.limitValue = null;
                                benefit.usage2.value= null;
                            } else {
                                benefit.usage2.availableValue = null;
                                //benefit.usage2.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                                benefit.usage2.limitValue = policyData.benefit_year_limit.limit;
                            }
                        }else {
                            benefit.usage2.availableValue = benefit.plan.limit2 - benefit.usage2.value;
                            benefit.usage2.limitValue = benefit.plan.limit2;
                        }
                    }                   
                }
            }

            benefit.plan = undefined;
            claim.policy_benefit_detail.push(benefit); 
        }

        claim.yearly_usage = policyData.yearly_usage;
        claim.yearly_usage_limit = policyData.benefit_year_limit.limit - policyData.yearly_usage;
        claim.claim_total_amount = 0;
        claim.covered_total_amount = 0;
        claim.excess_total_amount = 0;    
    }else{
        for (var x = 0;x< insuranceProduct.benefit.length;x++) {
            var benefit = insuranceProduct.benefit[x];
            var usageHistory = claim.policy_benefit_detail.find(us => {return us._id.toString() == benefit._id.toString()});
            benefit.plan = undefined;
            if(Boolean(usageHistory)){
                benefit.usage1 = usageHistory.usage1;                
                benefit.usage2 = usageHistory.usage2;
                benefit.unit_price_limit = usageHistory.unit_price_limit;
                benefit.unit_name = usageHistory.unit_name;
            }
        }
        claim.policy_benefit_detail = insuranceProduct.benefit;        
    }

    for (var x =0;x<claim.request_claim_note.length;x++){
        var benefit = claim.policy_benefit_detail.find(xs => xs._id.toString() == claim.request_claim_note[x].benefit.toString());
         benefit.note = claim.request_claim_note[x].note;
    }

        
    var benefitData = "";

    //console.log(JSON.stringify(claim.policy_benefit_detail));

    for (var x =0;x<claim.policy_benefit_detail.length;x++){
        var benefit = claim.policy_benefit_detail[x];
        if(benefit.is_group){
            rowcolor = "#95C5F0";
            benefitData+="<tr  style='background-color:" + rowcolor + ";color:white;font-weight:bold'><td colspan='3'>" + benefit.name + "</td></tr>"
        }else{
            if(!(Boolean(benefit.limit1) && benefit.limit1.valueType == config.limit_value_type.UnAvailable || (Boolean(benefit.limit2) && benefit.limit2.valueType == config.limit_value_type.UnAvailable))){
                if(x%2==0)
                    rowcolor = "#dedede";
                else
                    rowcolor = "#eeeeee";

                if(!Boolean(benefit.note))
                    benefit.note = "";
                
                //Col Benefit Name
                benefitData+= "<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td>";

                //Col sisa Benefit 
                benefitData+= "<td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div>";
                if(!apihelper.isEmptyObj(benefit.usage2.availableValue)){
                    benefitData += "<div>" + apihelper.formatThousandGroup(benefit.usage2.availableValue) + " "+ apihelper.formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name) + "</div>";
                }

                if(!apihelper.isEmptyObj(benefit.unit_price_limit) && benefit.unit_price_limit > 0){
                    benefitData += "<div>" + "limit per " + benefit.unit_name + " = " +  apihelper.formatThousandGroup(benefit.unit_price_limit) + "</div>";
                }
                benefitData+= "</td> <td style='width:150px'>" + benefit.note + "</td>  </tr>";

                /*if(apihelper.isEmptyObj(benefit.usage2.availableValue))
                    benefitData+="<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td><td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div></td>    <td style='width:150px'>" + benefit.note + "</td>  </tr>"
                else {
                    benefitData+="<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td><td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div> <div>" + apihelper.formatThousandGroup(benefit.usage2.availableValue) + " "+ apihelper.formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name) + "</div></td>    <td style='width:150px'>" + benefit.note + "</td>  </tr>"
                }*/
            }  
        }      
    } 
    //Total Sisa Limit
    benefitData+="<tr  style='background-color:#606060;color:white;font-weight:bold'><td>LIMIT TAHUNAN</td><td>" + apihelper.formatThousandGroup(claim.yearly_usage_limit) + "</td><td></td></td></td> </tr>"

    var tmp = moment(claim.request_claim_date);
    if(apihelper.isEmptyObj(claim.surat_jaminan_masuk_no)){
        /*Update no surat perkiraan biaya*/
        var cdate = moment().utc().format('YYYY-MM');
        var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_SURAT_JAMINAN},
        [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

        var counterVal = counter.value;
        if(counter.last_retrieve_date!=cdate){
            counterVal = 1;
        }    

        claim.sjm_file_name = `SURAT_JAMINAN_MASUK-${policyData.nama_tertanggung}-${claim.user.userId}-${tmp.format("DD_MMM_yyyy")}-${claim.hospital.name}.pdf`;
        claim.claim_status = 'SJM_CREATED';
        claim.surat_jaminan_masuk_by = req.user;
        claim.surat_jaminan_masuk_at = moment().utc().toDate();
        claim.surat_jaminan_masuk_no =  (apihelper.paddingZero(counterVal,5) + "/SH-SPM/" + apihelper.getUTCYear() );

        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();          
        
        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SJM_CREATED,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SJM_CREATED,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }



    var html = fs.readFileSync('./html/JaminanMasuk.html', 'utf8');
    var options = {
      phantomPath : config.phantomjsPath,
      width: '210mm',
      height: '297mm',
      border: '15mm'
    }

    html = html.replaceAll("#tanggalrequest#",tmp.format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#jamrequest#",tmp.format("HH:mm:ss"));
    html = html.replaceAll("#benefitTable#",benefitData);
    html = html.replaceAll("#claimid#",claim._id.toString());
    html = html.replaceAll("#createdby#",req.userName);

    html = html.replaceAll("#nosurat#",claim.surat_jaminan_masuk_no);
    html = html.replaceAll("#rsname#",claim.hospital.name);
    html = html.replaceAll("#namatertanggung#",policyData.nama_tertanggung);
    html = html.replaceAll("#niktertanggung#",policyData.nik_tertanggung);
    html = html.replaceAll("#dobtertanggung#",moment(policyData.dob_tertanggung).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#idsalvustertanggung#",claim.user.userId);
    html = html.replaceAll("#nokartutertanggung#",policyData.card_no);
    html = html.replaceAll("#claimcause#",claim.claim_reason);

    pdf.create(html,options).toFile(config.pdfPath + claim.sjm_file_name,(err, res)=>{
        if (err) return console.log(err);
        res.setHeader('Content-disposition', 'attachment; filename=' + claim.sjm_file_name);
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(config.pdfPath + claim.sjm_file_name);
        filestream.pipe(res);
    });
}));

router.post("/create_claim_detail/:id",  apihelper.authAccessOr({CLAIM:config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    //Surat jaminan masuk
    const id = req.params.id;

    var finalQuery = {_id:id}
    var currentDate = moment().startOf('day').utc().toDate();

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",undefined);

    var policyData = await UserPolicy.findOne({_id:claim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
    
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    claim.user = await User.findOne({_id:claim.user},'_id nama userId').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail User Claim tidak ditemukan",undefined);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",undefined);

    if(!apihelper.isEmptyObj(claim.sjm_file_name)){
        if(fs.existsSync(config.pdfPath + claim.sjm_file_name)) {
            var filename = path.basename(config.pdfPath + claim.sjm_file_name);
            var mimetype = mime.lookup(config.pdfPath + claim.sjm_file_name);
          
            res.setHeader('Content-disposition', 'attachment; filename=' + claim.sjm_file_name);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(config.pdfPath + claim.sjm_file_name);
            filestream.pipe(res);
            return;
        }    
    }

    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);

    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    for (var x = 0;x< insuranceProduct.benefit.length;x++) {
        var benefit = insuranceProduct.benefit[x];
        if(!Boolean(benefit.is_group)){
            benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);
            benefit.limit1 = satuan_limit_data.find(s=> s.key == benefit.plan.limit1Type);
            benefit.limit2 = satuan_limit_data.find(s=> s.key == benefit.plan.limit2Type);
        }
    }

    claim.yearly_usage =0;

    // capture data usage ke policy
    //isi benefit usage
    if(apihelper.isEmptyObj(claim.policy_benefit_detail)){
        claim.policy_benefit_detail = [];
        for (var x = 0;x< insuranceProduct.benefit.length;x++) {
            var benefit = insuranceProduct.benefit[x];
            benefit.usage1 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null,
            };
            benefit.usage2 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null
            };

            if(!Boolean(benefit.is_group)){
                if(Boolean(policyData.benefit_usage)){
                    var benefitUsage = policyData.benefit_usage.find(us => us.benefit.toString()== benefit._id.toString() );

                    if(Boolean(benefitUsage)){
                        benefit.unit_price_limit = benefit.plan.unit_price_limit;
                        benefit.unit_name = benefit.unit_name;    

                        var tmp = benefitUsage.usage1.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);

                        if(!apihelper.isEmptyObj(tmp)){                            
                            benefit.usage1.valueType = tmp.usage_valueType;
                            benefit.usage1.durationType = tmp.usage_durationType;

                            if(benefit.usage1.valueType == config.limit_value_type.Unit)
                                benefit.usage1.value = tmp.usage_jlh;
                            else if (benefit.usage1.valueType == config.limit_value_type.Amount)
                                benefit.usage1.value = tmp.usage_amount;
                            else if (benefit.usage1.valueType == config.limit_value_type.Claim)
                                benefit.usage1.value = 1;
                            else if (benefit.usage1.valueType == config.limit_value_type.AsClaim)
                                benefit.usage1.value = tmp.usage_amount;
                        }

                        var tmp2 = benefitUsage.usage2.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate)
                        if(!apihelper.isEmptyObj(tmp2)){
                            benefit.usage2.valueType = tmp2.usage_valueType;
                            benefit.usage2.durationType = tmp2.usage_durationType;      

                            if(benefit.usage2.valueType == config.limit_value_type.Unit)
                                benefit.usage2.value = tmp2.usage_jlh;
                            else if (benefit.usage2.valueType == config.limit_value_type.Amount)
                                benefit.usage2.value = tmp2.usage_amount;
                            else if (benefit.usage2.valueType == config.limit_value_type.Claim)
                                benefit.usage2.value = 1;
                            else if (benefit.usage2.valueType == config.limit_value_type.AsClaim)
                                benefit.usage2.value = tmp2.usage_amount;
                        }
                    }
                }

                if(benefit.unit == "2" && Boolean(benefit.plan.unit_price_limit)){
                    benefit.unit_price_limit = benefit.plan.unit_price_limit;
                    benefit.unit_name = benefit.unit_name;
                }

                if(benefit.plan.limit1Type == "99" || benefit.plan.limit2Type == "99"){
                    benefit.usage1.availableValue = null;
                } else {
                    var telahAdaUnlimited = false;
                    benefit.unit_price_limit = benefit.plan.unit_price_limit;
                    benefit.unit_name = benefit.unit_name;
                    
                    if(Boolean(benefit.limit1)){
                        benefit.usage1.valueType = benefit.limit1.valueType;
                        benefit.usage1.durationType = benefit.limit1.durationType;
                        benefit.usage1.unit_price_limit = benefit.limit1.unit_price_limit;

                        if(benefit.limit1.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            benefit.usage1.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                            benefit.usage1.limitValue = policyData.benefit_year_limit.limit;
                            telahAdaUnlimited = true;
                        }else{
                            benefit.usage1.availableValue = benefit.plan.limit1 - benefit.usage1.value;
                            benefit.usage1.limitValue = benefit.plan.limit1;
                        }
                    }

                    if(Boolean(benefit.limit2)){
                        benefit.usage2.valueType = benefit.limit2.valueType;
                        benefit.usage2.durationType = benefit.limit2.durationType;
                        benefit.usage2.unit_price_limit = benefit.limit2.unit_price_limit;
                        
                        if(benefit.limit2.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            if(telahAdaUnlimited) {
                                benefit.usage2.availableValue = null; // tidak perlu di munculkan limit yg sama 2 kali
                                benefit.usage2.limitValue = null;
                                benefit.usage2.value= null;
                            } else {
                                benefit.usage2.availableValue = null;
                                //benefit.usage2.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                                benefit.usage2.limitValue = policyData.benefit_year_limit.limit;
                            }
                        }else {
                            benefit.usage2.availableValue = benefit.plan.limit2 - benefit.usage2.value;
                            benefit.usage2.limitValue = benefit.plan.limit2;
                        }
                    }                   
                }
            }

            benefit.plan = undefined;
            claim.policy_benefit_detail.push(benefit); 
        }

        claim.yearly_usage = policyData.yearly_usage;
        claim.yearly_usage_limit = policyData.benefit_year_limit.limit - policyData.yearly_usage;
        claim.claim_total_amount = 0;
        claim.covered_total_amount = 0;
        claim.excess_total_amount = 0;    
    }else{
        for (var x = 0;x< insuranceProduct.benefit.length;x++) {
            var benefit = insuranceProduct.benefit[x];
            var usageHistory = claim.policy_benefit_detail.find(us => {return us._id.toString() == benefit._id.toString()});
            benefit.plan = undefined;
            if(Boolean(usageHistory)){
                benefit.usage1 = usageHistory.usage1;                
                benefit.usage2 = usageHistory.usage2;
                benefit.unit_price_limit = usageHistory.unit_price_limit;
                benefit.unit_name = usageHistory.unit_name;
            }
        }
        claim.policy_benefit_detail = insuranceProduct.benefit;        
    }

    for (var x =0;x<claim.request_claim_note.length;x++){
        var benefit = claim.policy_benefit_detail.find(xs => xs._id.toString() == claim.request_claim_note[x].benefit.toString());
         benefit.note = claim.request_claim_note[x].note;
    }

    var benefitData = "";

    //console.log(JSON.stringify(claim.policy_benefit_detail));

    for (var x =0;x<claim.policy_benefit_detail.length;x++){
        var benefit = claim.policy_benefit_detail[x];
        if(benefit.is_group){
            rowcolor = "#95C5F0";
            benefitData+="<tr  style='background-color:" + rowcolor + ";color:white;font-weight:bold'><td colspan='3'>" + benefit.name + "</td></tr>"
        }else{
            if(!(Boolean(benefit.limit1) && benefit.limit1.valueType == config.limit_value_type.UnAvailable || (Boolean(benefit.limit2) && benefit.limit2.valueType == config.limit_value_type.UnAvailable))){
                if(x%2==0)
                    rowcolor = "#dedede";
                else
                    rowcolor = "#eeeeee";

                if(!Boolean(benefit.note))
                    benefit.note = "";
                
                //Col Benefit Name
                benefitData+= "<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td>";

                //Col sisa Benefit 
                benefitData+= "<td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div>";
                if(!apihelper.isEmptyObj(benefit.usage2.availableValue)){
                    benefitData += "<div>" + apihelper.formatThousandGroup(benefit.usage2.availableValue) + " "+ apihelper.formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name) + "</div>";
                }

                if(!apihelper.isEmptyObj(benefit.unit_price_limit) && benefit.unit_price_limit > 0){
                    benefitData += "<div>" + "limit per " + benefit.unit_name + " = " +  apihelper.formatThousandGroup(benefit.unit_price_limit) + "</div>";
                }
                benefitData+= "</td> <td style='width:150px'>" + benefit.note + "</td>  </tr>";

                /*if(apihelper.isEmptyObj(benefit.usage2.availableValue))
                    benefitData+="<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td><td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div></td>    <td style='width:150px'>" + benefit.note + "</td>  </tr>"
                else {
                    benefitData+="<tr style='background-color:" + rowcolor + "'><td>" + benefit.name + "</td><td style='width:150px'><div>" + apihelper.formatThousandGroup(benefit.usage1.availableValue) + " "+ apihelper.formatUnitName(benefit.usage1.valueType,benefit.usage1.durationType,benefit.unit_name) + "</div> <div>" + apihelper.formatThousandGroup(benefit.usage2.availableValue) + " "+ apihelper.formatUnitName(benefit.usage2.valueType,benefit.usage2.durationType,benefit.unit_name) + "</div></td>    <td style='width:150px'>" + benefit.note + "</td>  </tr>"
                }*/
            }  
        }      
    } 
    //Total Sisa Limit
    benefitData+="<tr  style='background-color:#606060;color:white;font-weight:bold'><td>LIMIT TAHUNAN</td><td>" + apihelper.formatThousandGroup(claim.yearly_usage_limit) + "</td><td></td></td></td> </tr>"

    var tmp = moment(claim.request_claim_date);
    if(apihelper.isEmptyObj(claim.surat_jaminan_masuk_no)){
        /*Update no surat perkiraan biaya*/
        var cdate = moment().utc().format('YYYY-MM');
        var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_SURAT_JAMINAN},
        [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

        var counterVal = counter.value;
        if(counter.last_retrieve_date!=cdate){
            counterVal = 1;
        }    

        claim.claim_status = 'CLAIM_DETAIL';
        claim.surat_jaminan_masuk_by = req.user;
        claim.surat_jaminan_masuk_at = moment().utc().toDate();
        claim.surat_jaminan_masuk_no =  (apihelper.paddingZero(counterVal,5) + "/SH-SPM/" + apihelper.getUTCYear() );

        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();          
        
        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.CLAIM_DETAIL,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.CLAIM_DETAIL,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }

    return apihelper.APIResponseOK(res,true,"PROSES KLAIM DETAIL DIUBAH KE PROCESSED");
}));

router.get("/surat_jaminan_pulang/:id", apihelper.authAccessOr({CLAIM:config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",undefined);

    var policyData = await UserPolicy.findOne({_id:claim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
    
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    claim.user = await User.findOne({_id:claim.user},'_id nama userId').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail User Claim tidak ditemukan",undefined);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",undefined);


    if(!apihelper.isEmptyObj(claim.sjp_file_name)){
        if(fs.existsSync(config.pdfPath + claim.sjp_file_name)) {
            var filename = path.basename(config.pdfPath + claim.sjp_file_name);
            var mimetype = mime.lookup(config.pdfPath + claim.sjp_file_name);        
            res.setHeader('Content-disposition', 'attachment; filename=' + claim.sjp_file_name);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(config.pdfPath + claim.sjp_file_name);
            filestream.pipe(res);
            return;
        }    
    }
            

    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);
    
    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    var benefitData = "";
    for (var x=0;x<claim.claim.length;x++){
        var claimItem = claim.claim[x];
        var benefit = insuranceProduct.benefit.find(b => b._id.toString() == claimItem.benefit.toString());
        benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);

        var capturedUsage = claim.policy_benefit_detail.find(b => b._id.toString() == claimItem.benefit.toString());

        if(x%2==0)
            rowcolor = "#dedede";
        else
            rowcolor = "#eeeeee";

        benefitData+="<tr style='background-color:" + rowcolor + "'>"; 
        benefitData+= " <td>" + benefit.name + "</td>";

        benefitData+= " <td style='width:200px'><div>" + apihelper.formatThousandGroup(capturedUsage.usage1.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage1.valueType, capturedUsage.usage1.durationType,benefit.unit_name) + "</div>";
        if(Boolean(capturedUsage.usage2) && Boolean(capturedUsage.usage2.availableValue)){
            benefitData+= " <div>" + apihelper.formatThousandGroup(capturedUsage.usage2.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage2.valueType, capturedUsage.usage2.durationType,benefit.unit_name) + "</div>";
        }
        benefitData+= " </td>";

        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.claim_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount - claimItem.claim_amount) + "</td>";
        benefitData+="</tr>"
    }


    if(apihelper.isEmptyObj(claim.surat_jaminan_keluar_no)){
        /*Update no surat perkiraan biaya*/
        var cdate = moment().utc().format('YYYY-MM');
        var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_SURAT_JAMINAN_PULANG},
        [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

        var counterVal = counter.value;
        if(counter.last_retrieve_date!=cdate){
            counterVal = 1;
        }    
        var tmp = moment(claim.request_claim_date);
        claim.sjp_file_name = `SURAT_JAMINAN_PULANG-${policyData.nama_tertanggung}-${claim.user.userId}-${tmp.format("DD_MMM_yyyy")}-${claim.hospital.name}.pdf`;

        claim.claim_status = 'SPB_CREATED';
        claim.surat_jaminan_keluar_by = req.user;
        claim.surat_jaminan_keluar_at = moment().utc().toDate();
        claim.surat_jaminan_keluar_no =  (apihelper.paddingZero(counterVal,5) + "/SH-SPK/" + apihelper.getUTCYear() );
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();        

        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SPB_CREATED,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SPB_CREATED,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }



    var html = fs.readFileSync('./html/JaminanPulang.html', 'utf8');
    var options = {
        phantomPath : config.phantomjsPath,
        width: '210mm',
        height: '297mm',
        border: '15mm'
    }
    var tmp = moment(claim.request_claim_date);

    html = html.replaceAll("#username#",req.userName);
    html = html.replaceAll("#tanggalrequest#",tmp.format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#jamrequest#",tmp.format("HH:mm:ss"));
    html = html.replaceAll("#claimid#",claim._id.toString());
    html = html.replaceAll("#createdby#",req.userName);

    html = html.replaceAll("#benefitTable#",benefitData);
    html = html.replaceAll("#nosuratpenjaminanmasuk#",claim.surat_jaminan_masuk_no);
    html = html.replaceAll("#suratjaminanmasukdate#",moment(claim.surat_jaminan_masuk_at).format("DD MMM yyyy").toUpperCase());

    if(apihelper.isEmptyObj(insuranceProduct.excess_dijamin) || !insuranceProduct.excess_dijamin){
        html = html.replaceAll("#statusjaminanproduct#","TIDAK DIJAMINKAN");
        html = html.replaceAll("#statusjaminantext#","PASIEN WAJIB MELAKUKAN PEMBAYARAN EXCESS KEPADA PIHAK <b>" + claim.hospital.name + "</b> SEBELUM MENINGGALKAN FASILITAS");
    } else {
        html = html.replaceAll("#statusjaminanproduct#","DIJAMINKAN");
        html = html.replaceAll("#statusjaminantext#","PASIEN TIDAK WAJIB MELAKUKAN PEMBAYARAN EXCESS KEPADA PIHAK <b>" + claim.hospital.name + "</b> SEBELUM MENINGGALKAN FASILITAS");
    }
    html = html.replaceAll("#diagnosanote#",claim.diagnose_note);
    
    html = html.replaceAll("#nosurat#",claim.surat_jaminan_keluar_no);
    html = html.replaceAll("#rsname#",claim.hospital.name);
    html = html.replaceAll("#namatertanggung#",policyData.nama_tertanggung);
    html = html.replaceAll("#niktertanggung#",policyData.nik_tertanggung);
    html = html.replaceAll("#dobtertanggung#",moment(policyData.dob_tertanggung).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#idsalvustertanggung#",claim.user.userId);
    html = html.replaceAll("#nokartutertanggung#",policyData.card_no);
    html = html.replaceAll("#claimcause#",claim.claim_reason);
    
    pdf.create(html,options).toFile(config.pdfPath + claim.sjp_file_name,(err, res)=>{
        res.setHeader('Content-disposition', 'attachment; filename=' + claim.sjp_file_name);
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(config.pdfPath + claim.sjp_file_name);
        filestream.pipe(res);
    });

   
}));


router.get("/surat_perkiraan_biaya/:id", apihelper.authAccessOr({CLAIMPROCESS:config.action.Create|config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",undefined);

    if(apihelper.isEmptyObj(claim.surat_jaminan_keluar_no))
        return apihelper.APIResponseOK(res,false,"Silahkan buat surat jaminan pulang terlebih dahulu sebelum perkiraan biaya",undefined);
        
    if(apihelper.isEmptyObj(claim.surat_jaminan_masuk_no))
        return apihelper.APIResponseOK(res,false,"Silahkan create surat jaminan pulang terlebih dahulu",undefined);
          
    var policyData = await UserPolicy.findOne({_id:claim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
    
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    claim.user = await User.findOne({_id:claim.user},'_id nama userId').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail User Claim tidak ditemukan",undefined);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",undefined);

        
    if(!apihelper.isEmptyObj(claim.spb_file_name)){
        if(fs.existsSync(config.pdfPath + claim.spb_file_name)) {
            var filename = path.basename(config.pdfPath + claim.spb_file_name);
            var mimetype = mime.lookup(config.pdfPath + claim.spb_file_name);        
            res.setHeader('Content-disposition', 'attachment; filename=' + claim.spb_file_name);
            res.setHeader('Content-type', mimetype);
            var filestream = fs.createReadStream(config.pdfPath + claim.spb_file_name);
            filestream.pipe(res);
            return;
        }
    }
    

    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);
    
    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    var benefitData = "";
    for (var x=0;x<claim.claim.length;x++){
        var claimItem = claim.claim[x];
        var benefit = insuranceProduct.benefit.find(b => b._id.toString() == claimItem.benefit.toString());
        benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);

        var capturedUsage = claim.policy_benefit_detail.find(b => b._id.toString() == claimItem.benefit.toString());

        if(x%2==0)
            rowcolor = "#dedede";
        else
            rowcolor = "#eeeeee";

        benefitData+="<tr style='background-color:" + rowcolor + "'>"; 
        benefitData+= " <td>" + benefit.name + "</td>";
        
        benefitData+= " <td style='width:200px'><div>" + apihelper.formatThousandGroup(capturedUsage.usage1.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage1.valueType, capturedUsage.usage1.durationType,benefit.unit_name) + "</div>";
        if(Boolean(capturedUsage.usage2) && Boolean(capturedUsage.usage2.availableValue)){
            benefitData+= " <div>" + apihelper.formatThousandGroup(capturedUsage.usage2.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage2.valueType, capturedUsage.usage2.durationType,benefit.unit_name) + "</div>";
        }
        benefitData+= " </td>";

        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.claim_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount - claimItem.claim_amount) + "</td>";
        benefitData+="</tr>"
    }


    if(apihelper.isEmptyObj(claim.surat_perkiraan_biaya_no)){
        /*Update no surat perkiraan biaya*/
        var cdate = moment().utc().format('YYYY-MM');
        var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_SURAT_PERKIRAAN_BIAYA},
        [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

        var counterVal = counter.value;
        if(counter.last_retrieve_date!=cdate){
            counterVal = 1;
        }    

        var tmp = moment(claim.request_claim_date);
        claim.spb_file_name = `SURAT_PERKIRAAN_BIAYA-${policyData.nama_tertanggung}-${claim.user.userId}-${tmp.format("DD_MMM_yyyy")}-${claim.hospital.name}.pdf`;

        claim.surat_perkiraan_biaya_by = req.user;
        claim.surat_perkiraan_biaya_at = moment().startOf('day').utc().toDate();
        claim.surat_perkiraan_biaya_no =  (apihelper.paddingZero(counterVal,5) + "/SH-SPB/" + apihelper.getUTCYear() );
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();        
    }



    var html = fs.readFileSync('./html/PerkiraanBiayaPerawatan.html', 'utf8');
    var options = {
        phantomPath : config.phantomjsPath,
        width: '210mm',
        height: '297mm',
        border: '15mm'
    }
    var tmp = moment(claim.request_claim_date);

    html = html.replaceAll("#username#",req.userName);
    html = html.replaceAll("#tanggalrequest#",tmp.format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#jamrequest#",tmp.format("HH:mm:ss"));
    html = html.replaceAll("#claimid#",claim._id.toString());
    html = html.replaceAll("#createdby#",req.userName);

    html = html.replaceAll("#benefitTable#",benefitData);
    html = html.replaceAll("#nosuratpenjaminanmasuk#",claim.surat_jaminan_masuk_no);
    html = html.replaceAll("#suratjaminanmasukdate#",moment(claim.surat_jaminan_masuk_at).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#nosuratpenjaminanpulang#",claim.surat_jaminan_keluar_no);
    html = html.replaceAll("#suratjaminanpulangdate#",moment(claim.surat_jaminan_keluar_at).format("DD MMM yyyy").toUpperCase());


    html = html.replaceAll("#nosuratpenjaminanpulang#",claim.surat_jaminan_keluar_no);
    if(apihelper.isEmptyObj(insuranceProduct.excess_dijamin) || !insuranceProduct.excess_dijamin){
        html = html.replaceAll("#statusjaminanproduct#","TIDAK DIJAMINKAN");
        html = html.replaceAll("#statusjaminantext#","PASIEN WAJIB MELAKUKAN PEMBAYARAN EXCESS KEPADA PIHAK <b>" + claim.hospital.name + "</b> SEBELUM MENINGGALKAN FASILITAS");
    } else {
        html = html.replaceAll("#statusjaminanproduct#","DIJAMINKAN");
        html = html.replaceAll("#statusjaminantext#","PASIEN TIDAK WAJIB MELAKUKAN PEMBAYARAN EXCESS KEPADA PIHAK <b>" + claim.hospital.name + "</b> SEBELUM MENINGGALKAN FASILITAS");
    }
    html = html.replaceAll("#diagnosanote#",claim.diagnose_note);
    
    html = html.replaceAll("#nosurat#",claim.surat_perkiraan_biaya_no);
    html = html.replaceAll("#rsname#",claim.hospital.name);
    html = html.replaceAll("#namatertanggung#",policyData.nama_tertanggung);
    html = html.replaceAll("#niktertanggung#",policyData.nik_tertanggung);
    html = html.replaceAll("#dobtertanggung#",moment(policyData.dob_tertanggung).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#idsalvustertanggung#",claim.user.userId);
    html = html.replaceAll("#nokartutertanggung#",policyData.card_no);
    html = html.replaceAll("#claimcause#",claim.claim_reason);
    
    pdf.create(html,options).toFile(config.pdfPath + claim.spb_file_name,(err, res)=> {
        res.setHeader('Content-disposition', 'attachment; filename=' + claim.spb_file_name);
        res.setHeader('Content-type', mimetype);
        var filestream = fs.createReadStream(config.pdfPath + claim.spb_file_name);
        filestream.pipe(res);
    });

    // pdf.create(html,options).toStream(function(err, stream){
    //     if (err) return console.log(err);
    //     res.setHeader('Content-disposition', `attachment; filename=SURAT_PERKIRAAN_BIAYA-${policyData.nama_tertanggung}-${claim.user.userId}-${tmp.format("DD_MMM_yyyy")}-${claim.hospital.name}.pdf`);
    //     stream.pipe(res);
    // });
}));


router.post("/sent_spb/:id", apihelper.authAccessOr({CLAIMPROCESS:config.action.Create|config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",claim);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name admin_email').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",claim);
    
    if(!Boolean(claim.hospital.admin_email))
        return apihelper.APIResponseOK(res,false,"Silahkan set terlebih dahulu email dari admin Provider di menu Service Provider",claim);

    claim.policy = await UserPolicy.findOne({_id:claim.policy},'_id nama_tertanggung nik_tertanggung').lean().exec();
    if(apihelper.isEmptyObj(claim.policy))
        return apihelper.APIResponseOK(res,false,"Detail Polis Claim tidak ditemukan",claim);
    
    
    if(apihelper.isEmptyObj(claim.surat_perkiraan_biaya_no) || apihelper.isEmptyObj(claim.surat_jaminan_keluar_no))
        return apihelper.APIResponseOK(res,false,"Silahkan buat surat jaminan pulang dan surat perkiraan biaya dahulu", undefined);
    

    if(claim.claim_status == 'SPB_CREATED') {
        claim.claim_status = 'SPB_SENT';
        claim.surat_jaminan_keluar_sent_by = req.user;
        claim.surat_jaminan_keluar_sent_at = moment().utc().toDate();
    
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();      

        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SPB_SENT,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.SPB_SENT,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }
    

    var tmp = moment(claim.request_claim_date);

    if(!(fs.existsSync(config.pdfPath + claim.sjp_file_name) && fs.existsSync(config.pdfPath + claim.spb_file_name))) 
        return apihelper.APIResponseOK(res,false,"Silahkan create terlebih dahulu surat perkiraan biaya dan surat jaminan pulang sebelum mengirimkan nya ",claim);

    var attachment = [
        {
            filename: claim.sjp_file_name,
            path: config.pdfPath + claim.sjp_file_name
        },
        {
            filename: claim.spb_file_name,
            path: config.pdfPath + claim.spb_file_name
        }
    ]

    var html = fs.readFileSync('./html/JaminanPulangEmail.html', 'utf8');

    html = html.replaceAll("#nosuratspk#",claim.surat_jaminan_masuk_no);
    html = html.replaceAll("#tanggalrequestspk#",moment(claim.surat_jaminan_masuk_at).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#nosuratspb#",claim.surat_jaminan_keluar_no);
    html = html.replaceAll("#tanggalrequestspb#",moment(claim.surat_jaminan_keluar_at).format("DD MMM yyyy").toUpperCase());
    html = html.replaceAll("#rsname#",claim.hospital.name);
    html = html.replaceAll("#namatertanggung#",claim.policy.nama_tertanggung);
    html = html.replaceAll("#niktertanggung#",claim.policy.nik_tertanggung);
        
    var emailSubject = "SURAT JAMINAN KEPULANGAN & SURAT PERKIRAAN BIAYA-" + claim.hospital.name + "-" + claim.policy.nama_tertanggung + "-" + moment(claim.surat_jaminan_keluar_at).format("DD MMM yyyy").toUpperCase()    
    var resultEmail = await apihelper.sendEmail(claim.hospital.admin_email,emailSubject,html,attachment); 

    return apihelper.APIResponseOK(res,true,"Data telah di dikirim ke " + claim.hospital.admin_email);
}))

router.post("/pending_reimburse/:id", apihelper.authAccessOr({CLAIMPROCESS:config.action.Create|config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",claim);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name admin_email').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",claim);
    
    if(!Boolean(claim.hospital.admin_email))
        return apihelper.APIResponseOK(res,false,"Silahkan set terlebih dahulu email dari admin Provider di menu Service Provider",claim);

    claim.policy = await UserPolicy.findOne({_id:claim.policy},'_id nama_tertanggung nik_tertanggung').lean().exec();
    if(apihelper.isEmptyObj(claim.policy))
        return apihelper.APIResponseOK(res,false,"Detail Polis Claim tidak ditemukan",claim);
          
    var policyData = await UserPolicy.findOne({_id:claim.policy}).lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false, "Data Polis tidak di temukan",undefined);

    var insuranceProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product}).lean().exec();
    if(apihelper.isEmptyObj(insuranceProduct))
        return apihelper.APIResponseOK(res, false, "Data Product tidak di temukan",undefined);
    
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    claim.user = await User.findOne({_id:claim.user},'_id nama userId').lean().exec();
    if(apihelper.isEmptyObj(claim.user))
        return apihelper.APIResponseOK(res,false,"Detail User Claim tidak ditemukan",undefined);

    claim.hospital = await HospitalSchema.findOne({_id:claim.hospital},'_id name').lean().exec();
    if(apihelper.isEmptyObj(claim.hospital))
        return apihelper.APIResponseOK(res,false,"Detail Hospital Claim tidak ditemukan",undefined);

        

    policyData.benefit_year_limit = insuranceProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);
    
    if(apihelper.isEmptyObj(policyData.yearly_usage))
        policyData.yearly_usage = 0;

    var benefitData = "";
    for (var x=0;x<claim.claim.length;x++){
        var claimItem = claim.claim[x];
        var benefit = insuranceProduct.benefit.find(b => b._id.toString() == claimItem.benefit.toString());
        benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);

        var capturedUsage = claim.policy_benefit_detail.find(b => b._id.toString() == claimItem.benefit.toString());

        if(x%2==0)
            rowcolor = "#dedede";
        else
            rowcolor = "#eeeeee";

        benefitData+="<tr style='background-color:" + rowcolor + "'>"; 
        benefitData+= " <td>" + benefit.name + "</td>";
        
        benefitData+= " <td style='width:200px'><div>" + apihelper.formatThousandGroup(capturedUsage.usage1.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage1.valueType, capturedUsage.usage1.durationType,benefit.unit_name) + "</div>";
        if(Boolean(capturedUsage.usage2) && Boolean(capturedUsage.usage2.availableValue)){
            benefitData+= " <div>" + apihelper.formatThousandGroup(capturedUsage.usage2.availableValue) + " "+ apihelper.formatUnitName(capturedUsage.usage2.valueType, capturedUsage.usage2.durationType,benefit.unit_name) + "</div>";
        }
        benefitData+= " </td>";

        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.claim_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount) + "</td>";
        benefitData+= " <td style='width:200px'>" + apihelper.formatThousandGroup(claimItem.covered_amount - claimItem.claim_amount) + "</td>";
        benefitData+="</tr>"
    }


    if(apihelper.isEmptyObj(claim.surat_perkiraan_biaya_no)){
        /*Update no surat perkiraan biaya*/
        /*var cdate = moment().utc().format('YYYY-MM');
        var counter = await  CounterSchema.findOneAndUpdate({ counter_name : config.const.COUNTER_NAME_SURAT_PERKIRAAN_BIAYA},
        [{$addFields: {last_retrieve_date: cdate,value: { $cond: [ { $eq: [ "$last_retrieve_date",cdate ] }, { $add: [ "$value", 1 ] }, 1 ]}}}]);

        var counterVal = counter.value;
        if(counter.last_retrieve_date!=cdate){
            counterVal = 1;
        }    

        var tmp = moment(claim.request_claim_date);
        claim.spb_file_name = `SURAT_PERKIRAAN_BIAYA-${policyData.nama_tertanggung}-${claim.user.userId}-${tmp.format("DD_MMM_yyyy")}-${claim.hospital.name}.pdf`;
        */
        claim.surat_perkiraan_biaya_by = "TIDAK DIBUAT";
        claim.surat_perkiraan_biaya_at = moment().startOf('day').utc().toDate();
        claim.surat_perkiraan_biaya_no = "TIDAK DIBUAT";
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();        
    }
    


    if(claim.claim_status == 'PROCESSED' && claim.cashless == false) {
        claim.claim_status = 'PENDING_REIMBURSE';
        claim.surat_jaminan_keluar_sent_by = req.user;
        claim.surat_jaminan_keluar_sent_at = moment().utc().toDate();
    
        await UserClaim.findByIdAndUpdate(finalQuery, claim,{
            upsert:true
        }).exec();      

        await History.create({
            title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.PENDING_REIMBURSE,
            description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.PENDING_REIMBURSE,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }
    

    return apihelper.APIResponseOK(res,true,"PROSES KLAIM DIUBAH KE PENDING REVIEW (REIMBURSE)");
}))

router.post("/upload/remove/:claimid/:docId", apihelper.authAccessOr({CLAIMPROCESS:config.action.Create|config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const claimid = req.params.claimid;
    const docId = req.params.docId

    var finalQuery = {_id:claimid}

    var claim = await UserClaim.findOne(finalQuery).exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseErr(res,false,"Detail Claim tidak ditemukan",claim);

    if(!(['CREATED','PROCESSED','SJM_CREATED','SJM_SENT','CLAIM_DETAIL'].includes(claim.claim_status)))
        return apihelper.APIResponseErr(res,false,"Tidak dapat mengedit dokument, status dokument invalid",claim);
 
    for (var index=0;index<claim.document.length;index++) {
        var doc = claim.document[index];
        if(doc._id.toString() == docId){
            claim.document.splice(index, 1);
            var fileAbsPath =  config.uploadTempPath  + doc.path;
            
            try{
                fs.unlinkSync(fileAbsPath);
            } catch(e){                
            }
            await claim.save();   
        }
    }

    return apihelper.APIResponseOK(res,true,"",null);
}))

router.post("/upload/:id",  apihelper.authAccessOr({CLAIMPROCESS:config.action.Create|config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {file} = req.query;
    const id = req.params.id;
    const docType = req.headers.type
    
    var finalQuery = {_id:id}

    var claim = await UserClaim.findOne(finalQuery).exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseErr(res,false,"Detail Claim tidak ditemukan",claim);

    if(!(['SJM_SENT','SPB_CREATED','PROCESSED','CLAIM_DETAIL'].includes(claim.claim_status)))
        return apihelper.APIResponseErr(res,false,"Tidak dapat mengedit dokument, status dokument invalid",claim);

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext=='.bmp' || ext=='.jfif')){
            return apihelper.APIResponseErr(res,false,"File yg dapat di upload hanya jpg, jpeg, png dan bmp",null);
        }

        var fileAbsPath =  `/claim_document/${id}/`;
        if (!fs.existsSync(config.uploadTempPath  + fileAbsPath)){
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }
        var fileName = strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        fstream.on('close', function () {    
            var stats = fs.statSync(config.uploadTempPath + fileAbsPath + fileName);
            var newImage = {
                _id: mongoose.Types.ObjectId(),
                size:stats.size,
                name:filename,
                mimetype:mimetype,
                path:fileAbsPath + fileName,
                type:docType
            }
            claim.document.push(newImage);            

            claim.save(function(err,model){
                return apihelper.APIResponseOK(res,true,"",{
                    _id:newImage._id
                });
            });
        });
    });
}))

router.post("/reject/:id", apihelper.authAccessOr({CLAIM:config.action.Update}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var data = req.body;
    var finalQuery = {_id:id}
    

    var claim = await UserClaim.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Detail Claim tidak ditemukan",claim);

    if( !(['CREATED','SJM_SENT','SJM_CREATED', 'CLAIM_DETAIL'].includes(claim.claim_status)))
        return apihelper.APIResponseOK(res,false,"Tidak dapat mereject claim, status tidak sesuai  ",claim);

    claim.claim_status = 'REJECTED';
    claim.rejected_by = req.user;
    claim.rejected_date = moment().utc().toDate();
    claim.insurance_product_reject_note = data.insurance_product_reject_note;

    await UserClaim.findByIdAndUpdate(finalQuery, claim,{
        upsert:true
    }).exec();      

    await History.create({
        title:"KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.REJECTED,
        description : "KLAIM NO " + claim.claim_no + ": " + config.claim_status_text.REJECTED,
        type : "CLAIM",
        user : claim.user,
        created_at : moment().utc().toDate(),
        created_by : req.user
    });

    return apihelper.APIResponseOK(res,true,"Data telah di update");
}))



module.exports = router;