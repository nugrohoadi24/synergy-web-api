const config = require('../config/config');
const router = require('express').Router();
const CompanyPolicy = require('../models/CompanyPolicy');
const Company = require('../models/Company');
const Admin = require('../models/Admin');
const moment = require('moment');
const apihelper = require('../helper/APIHelper');


const authM = apihelper.auth(['ADM',"CL"]);

router.get("/", apihelper.authAccessOr({MCOMPPOLICY:config.action.View}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({policy_no : q});
        finalQuery["$or"].push({note : q});
    }

    var result = CompanyPolicy.paginate(finalQuery, { 
        select: "_id company policy_no note policy_date policy_end_date is_active created_at updated_at",
        populate: { path: 'company', select: '_id code name' },
        page: page, 
        limit: parseInt(perpage),
        sort: sb==""?undefined:sb
    },    
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

router.get("/detail/:id", apihelper.authAccessOr({MCOMPPOLICY:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}
    var policyData = await CompanyPolicy.findOne(finalQuery).lean().exec();

    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false,"Data tidak di temukan",undefined);

    if(Boolean(policyData.company)){
        policyData.company = await Company.findOne({_id: policyData.company},"_id name").lean().exec();
    }

    if(Boolean(policyData.updated_by))
        policyData.updated_by = await Admin.findOne({_id: policyData.updated_by},"_id name").lean().exec();

    if(Boolean(policyData.created_by))
        policyData.created_by = await Admin.findOne({_id: policyData.created_by},"_id name").lean().exec();

    return apihelper.APIResponseOK(res,true,"",policyData);

}))

router.get("/selection/", apihelper.authAccessOr({
    MCOMPPOLICY:config.action.View,
    MDEPOSIT:config.action.View,
    RCLAIMRATIO:config.action.View|config.action.Create|config.action.Update,
    RCLAIMDETAIL:config.action.View|config.action.Create|config.action.Update,
    RTOPTEN:config.action.View|config.action.Create|config.action.Update,
    MPARTICIPANT:config.action.View|config.action.Create|config.action.Update
    }) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {company} = req.query;
    
    var finalQuery = {is_active:true,company:company}

    var result = await  CompanyPolicy.paginate(finalQuery, { 
        select: "_id policy_no",
        page: 1, 
        lean: true,
        limit: 100
    });

    return apihelper.APIResponseOK(res,true,"",result);
}))


router.get("/selection/all/", apihelper.authAccessOr({
    MCOMPPOLICY:config.action.View,
    MDEPOSIT:config.action.View,
    RCLAIMRATIO:config.action.View|config.action.Create|config.action.Update,
    RCLAIMDETAIL:config.action.View|config.action.Create|config.action.Update,
    RTOPTEN:config.action.View|config.action.Create|config.action.Update,
    MPARTICIPANT:config.action.View|config.action.Create|config.action.Update
    }) ,  apihelper.handleErrorAsync(async (req, res, next) => {

    var {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = {is_active:true}

    perpage = 10;

    var result = await CompanyPolicy.aggregate([
        {$lookup: { 
            from: "company",
            localField:"company",
            foreignField:"_id",
            as:"company"
        }}, 
        {$unwind:"$company"},
        {$match : finalQuery},
        { $project: {'_id':1,'policy_no':1,'company.name':1,'company._id':1}},
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
                result[0].docs[x].desc = result[0].docs[x].policy_no + " / "+ result[0].docs[x].company.name;
                result[0].docs[x].company = undefined;
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
        return apihelper.APIResponseOK(res,true,"No Data",undefined);
    }

    return apihelper.APIResponseOK(res,false,"No Data",undefined);
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    if(!Boolean(data.policy_no))
          errmsg += "* Silahkan input no polis\n";

    if(!Boolean(data.company))
        errmsg += "* Silahkan input perusahaan \r\n";

    if(!Boolean(data.policy_date))
        errmsg += "* Silahkan policy date \r\n";

    if(!Boolean(data.policy_end_date))
        errmsg += "* Silahkan policy date end\r\n";

    if(!Boolean(errmsg)){
        var company =await Company.findOne({_id : data.company._id});
       
        if(!Boolean(company)){
            errmsg += "* company tidak di temukan, silahkan cek kembali data anda\r\n";
        }
    }


    
    if(Boolean(errmsg)) {
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }
    
    var existingData = await CompanyPolicy.findOne({policy_no:data.policy_no,_id:{$nin:[data._id]}});
    if(!apihelper.isEmptyObj(existingData)){
        return apihelper.APIResponseOK(res, false,"* No polis "+ data.policy_no + " Telah ada sebelumnya \r\n",undefined);
    }

    if(data._id) {    
        var existingData = await CompanyPolicy.findOne({_id:data._id}).exec();        
        existingData.updated_by = req.user;
        existingData.updated_at = moment().utc().toDate();        

        if(existingData.is_used){
            existingData.note = data.note;
            errmsg = "Data telah pernah di gunakan sebelumnya, hanya dapat mengupdate note"
        }else{
            existingData.company = data.company;
            existingData.policy_no = data.policy_no;
            existingData.policy_date = data.policy_date;
            existingData.policy_end_date = data.policy_end_date;
            existingData.note = data.note;
            existingData.is_active = data.is_active;
            errmsg = "Data Updated"
        }
        existingData.save();
    }else{
        data.created_by = req.user;
        data.created_at = moment().utc().toDate();        
        errmsg = "Data Tersimpan"
        var result = await CompanyPolicy.create(data);
    }
    return apihelper.APIResponseOK(res, true,errmsg,undefined);

})

router.put("/", apihelper.authAccessOr({MCOMPPOLICY:config.action.Create}) , dataFunc)

router.post("/", apihelper.authAccessOr({MCOMPPOLICY:config.action.Update}) , dataFunc)

router.delete("/:id", apihelper.authAccessOr({MCOMPPOLICY:config.action.Delete}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var policyData = await CompanyPolicy.findOne({_id:id}).exec();

    if(policyData.is_used){
        return apihelper.APIResponseOK(res, false,"Policy ini telah digunakan",undefined);
    }

    var result = await CompanyPolicy.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;