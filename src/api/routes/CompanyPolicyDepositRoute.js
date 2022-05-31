const config = require('../config/config');
const router = require('express').Router();
const CompanyPolicy = require('../models/CompanyPolicy');
const CompanyPolicyDeposit = require('../models/CompanyPolicyDeposit');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const moment = require('moment');
const apihelper = require('../helper/APIHelper');



router.get("/", apihelper.authAccessOr({MDEPOSIT:config.action.View}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({"company.name" : q});
        finalQuery["$or"].push({"company_policy.policy_no" : q});
        finalQuery["$or"].push({note : q});
    }

    var result = await CompanyPolicyDeposit.aggregate([
        {$lookup: { 
            from: "CompanyPolicy",
            localField:"company_policy",
            foreignField:"_id",
            as:"company_policy"
        }}, 
        {$unwind:"$company_policy"},
        {$lookup: { 
            from: "company",
            localField:"company_policy.company",
            foreignField:"_id",
            as:"company"
        }}, 
        {$unwind:"$company"},
        {$match : finalQuery},
        { $sort: {sb:1}},
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




router.get("/detail/:id", apihelper.authAccessOr({MDEPOSIT:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}
    var data = await CompanyPolicyDeposit.findOne(finalQuery).lean().exec();

    if(apihelper.isEmptyObj(data))
        return apihelper.APIResponseOK(res, false,"Data tidak di temukan",undefined);

    if(Boolean(data.company_policy)){
        data.company_policy = await CompanyPolicy.findOne({_id: data.company_policy},"_id policy_no company").lean().exec();
    }
    
    if(Boolean(data.company_policy.company)) {
        data.company = await Company.findOne({_id: data.company_policy.company},"_id name").lean().exec();
        data.company_policy.desc = data.company_policy.policy_no + " / " + data.company.name;
    }

    if(Boolean(data.updated_by))
        data.updated_by = await Admin.findOne({_id: data.updated_by},"_id name").lean().exec();

    if(Boolean(data.created_by))
        data.created_by = await Admin.findOne({_id: data.created_by},"_id name").lean().exec();


    return apihelper.APIResponseOK(res,true,"",data);
}))


var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    if(!Boolean(data.transaction_date))
          errmsg += "* Silahkan input tanggal transaksi\n";

    if(!Boolean(data.amount))
        errmsg += "* Silahkan input jumlah deposit\r\n";

    var companyPolicy = null;
    if(!Boolean(data.company_policy))
        errmsg += "* Silahkan input Company Coverage\r\n";
    else 
        companyPolicy = await CompanyPolicy.findOne({_id : data.company_policy});

    if(!Boolean(companyPolicy)){
        errmsg += "* company policy tidak di temukan, silahkan cek kembali data anda\r\n";
    }

    if(Boolean(errmsg)) {
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }
    
    if(data._id) {           
        var existingData = await CompanyPolicyDeposit.findOne({_id:data._id}).exec();        
        existingData.updated_by = req.user;
        existingData.updated_at = moment().utc().toDate();        
        existingData.note = data.note;
        existingData.transaction_date = moment(data.transaction_date).utc().startOf('day').toDate();
        existingData.amount = data.amount;        
        errmsg = "Data Tersimpan"
        existingData.save();
    }else{
        var companyPolicy = await CompanyPolicy.findOne({_id:data.company_policy}).exec();        
        companyPolicy.is_used = true;
        companyPolicy.save();

        data.created_by = req.user;
        data.created_at = moment().utc().toDate();        
        errmsg = "Data Tersimpan"
        var result = await CompanyPolicyDeposit.create(data);
    }
    return apihelper.APIResponseOK(res, true,errmsg,undefined);

})

router.put("/", apihelper.authAccessOr({MDEPOSIT:config.action.Create}) , dataFunc)

router.post("/", apihelper.authAccessOr({MDEPOSIT:config.action.Update}) , dataFunc)

router.delete("/:id", apihelper.authAccessOr({MDEPOSIT:config.action.Delete}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var result = await CompanyPolicyDeposit.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;