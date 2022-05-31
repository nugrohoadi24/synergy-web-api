const config = require('../config/config');
const strHelper = require('../helper/StringHelper');
const router = require('express').Router();

const Admin = require('../models/Admin');
const User = require('../models/User');
const ClaimClosure = require('../models/ClaimClosure');
const UserClaim = require('../models/UserClaim');
const History = require('../models/History');

var mongoose = require('mongoose');
const moment = require('moment');
var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');


const apihelper = require('../helper/APIHelper');
const e = require('express');

const authM = apihelper.auth(['ADM',"CL"]);

router.get("/:claimId",apihelper.authAccessOr({CLAIMCLOSURE:config.action.View}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const claimId = req.params.claimId;
    const {page, perpage,searchquery,sb,sd,status} = req.query;
    
    var ObjectId = require('mongoose').Types.ObjectId; 

    var finalQuery = {
        user_claim:new ObjectId(claimId)
    };

    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({note:q});
        finalQuery["$or"].push({"closure_action_ref.name":q});
    }
    var resultCount =  await ClaimClosure.count(finalQuery).exec();


    var result1 = await ClaimClosure.aggregate([
        { $lookup:
            {
               from: "closure_action",
               localField: "closure_action",
               foreignField: "key",
               as: "closure_action_ref"
            }
        },
        {"$unwind": "$closure_action_ref"},
        { $match: finalQuery},
        { "$sort": { "created_date": -1 } },
        { "$skip": (parseInt(page)-1) * parseInt(perpage) } ,       
        { "$limit": parseInt(perpage)}
    ]).exec();

    return apihelper.APIResponseOK(res,true,"",{
        page:page,
        pages:resultCount/perpage,
        total:resultCount,
        limit:perpage,
        docs:result1
    });

}))

router.get("/detail/:id",apihelper.authAccessOr({CLAIMCLOSURE:config.action.View}), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var claimClosure = await ClaimClosure.findOne(finalQuery).lean().exec();
    if(apihelper.isEmptyObj(claimClosure))
        return apihelper.APIResponseOK(res,false,"Claim closure tidak ditemukan",null);
    
    return apihelper.APIResponseOK(res,true,"",claimClosure); 
}))


var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if(!Boolean(data.closure_action))
        return apihelper.APIResponseOK(res,false,"Action closure harus di isi",null);

    if(!(config.admin_closure_type.hasOwnProperty(data.closure_action) || config.finance_closure_type.hasOwnProperty(data.closure_action)))
        return apihelper.APIResponseOK(res,false,"Action closure tidak valid",null);

    var claim = await UserClaim.findOne({_id:data.user_claim}).exec();
    if(apihelper.isEmptyObj(claim))
        return apihelper.APIResponseOK(res,false,"Claim tidak ditemukan",null);

    if(claim.claim_status == config.claim_status.PAID)
        return apihelper.APIResponseOK(res,false,"Claim telah di bayar, tidak dapat mengupdate data lagi",null);

     
    claim.claim_status = config.claim_status.CLOSURE;
    if(data.closure_action == config.admin_closure_type.SPB_DITERIMA) {
        if(apihelper.isEmptyObj(claim.claim_form_received_date))
            claim.claim_form_received_date = moment().utc().toDate();        
    }else if(data.closure_action == config.finance_closure_type.DANA_CAIR){
        if(apihelper.isEmptyObj(claim.complete_date))
            claim.complete_date = moment().utc().toDate();
    }else if(data.closure_action == config.finance_closure_type.TELAH_DIBAYAR){
        if(apihelper.isEmptyObj(claim.paid_date))
            claim.paid_date = moment().utc().toDate();
        claim.claim_status = config.claim_status.PAID;

        await History.create({
            title:"KLAIM NO " + claim.claim_no + " SAAT INI TELAH " + config.claim_status_text.PAID,
            description :"KLAIM NO " + claim.claim_no + " SAAT INI TELAH " + config.claim_status_text.PAID,
            type : "CLAIM",
            user : claim.user,
            created_at : moment().utc().toDate(),
            created_by : req.user
        });
    }

    claim.closure_remark = data.note;
    await claim.save();

    if(data._id) {
        data.updated_by = req.user;
        data.updated_at = moment().utc().toDate();        
        var result = await ClaimClosure.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{
        data.created_at = moment().utc().toDate();        
        data.created_by = req.user;
        var result = await ClaimClosure.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/",apihelper.authAccessOr({CLAIMCLOSURE:config.action.Create}),dataFunc )

router.post("/",apihelper.authAccessOr({CLAIMCLOSURE:config.action.Update}),dataFunc )

router.delete("/:id",apihelper.authAccessOr({CLAIMCLOSURE:config.action.Delete}), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await ClaimClosure.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))

module.exports = router;