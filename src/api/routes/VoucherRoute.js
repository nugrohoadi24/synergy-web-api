const config = require('../config/config');
const router = require('express').Router();
const Voucher = require('../models/Voucher');
const VoucherWallet = require('../models/VoucherWallet');
const UploadTemp = require('../models/UploadTemp');
const provider = require('../models/Hospital');
const apihelper = require('../helper/APIHelper');

const moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
const mongoose = require('mongoose');
const strHelper = require('../helper/StringHelper');


router.get("/", apihelper.authAccessOr({
    VOUCHER:config.action.View
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Voucher.paginate(finalQuery, { 
        select: "_id name limit_days end_date price wallet_count purchase_count redeem_count provider is_active created_at updated_at",
        page: page, 
        populate: { path: 'provider', select: '_id code name' },
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


router.get("/selection", apihelper.authAccessOr({
    VOUCHER:config.action.View
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Voucher.paginate(finalQuery, { 
        select: "_id name",
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


router.get("/detail/:id", apihelper.authAccessOr({
    VOUCHER:config.action.View
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;
    
    var ObjectId = require('mongoose').Types.ObjectId; 

    var finalQuery = {
        _id:new ObjectId(dataid)
    };

    var result1 = await Voucher.findOne(finalQuery).lean().exec();

    result1.provider =await provider.findOne({_id:result1.provider},"_id name").lean().exec();

    return apihelper.APIResponseOK(res,true,"",result1);
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if(apihelper.isEmptyObj(data.name))
        return apihelper.APIResponseOK(res, false, "Silahkan isi nama",undefined);

    if(apihelper.isEmptyObj(data.short_description))
        return apihelper.APIResponseOK(res, false, "Silahkan isi deskripsi",undefined);

    if(apihelper.isEmptyObj(data.description))
        return apihelper.APIResponseOK(res, false, "Silahkan isi deskripsi singkat",undefined);

    if(apihelper.isEmptyObj(data.category))
        return apihelper.APIResponseOK(res, false, "Silahkan isi category",undefined);

    if(apihelper.isEmptyObj(data.provider))
        return apihelper.APIResponseOK(res, false, "Silahkan isi provider",undefined);
        

    if(data._id) {
        var currentVoucherData = await Voucher.findById(data._id).lean().exec();
        if(currentVoucherData.purchase_count>0)
            return apihelper.APIResponseOK(res, false,"Voucher ini tidak dapat di delete karena telah terdapat transaksi",undefined);        
    }
 
    console.log(data)

    let session = await mongoose.startSession();
    session.startTransaction();
    try{
        if(data._id) {

    
            data.updated_by = req.user;
            data.updated_at = moment().utc().toDate();  
    
            var result = await Voucher.findByIdAndUpdate({_id:data._id}, data,{
                upsert:true,
                session: session 
            }).exec();     
        }else{
            data.is_active = true;

            data.created_at = moment().utc().toDate();        
            data.created_by = req.user;
            await Voucher.create([data],{session: session});
        }

        await session.commitTransaction();   
        return apihelper.APIResponseOK(res, true,"",undefined);
    }catch(exc){
        await session.abortTransaction();        
        return apihelper.APIResponseOK(res, false,exc.message,undefined);
    }finally{
        session.endSession();
    }
})

router.put("/", apihelper.authAccessOr({
    VOUCHER:config.action.Create
}) ,dataFunc)

router.post("/", apihelper.authAccessOr({
    VOUCHER:config.action.Update
}) ,dataFunc)


router.post("/generate", apihelper.authAccessOr({
    VOUCHER:config.action.Update
}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const count = req.body.count;
    const voucherid = req.body.voucher;

    var voucherWallets = [];
    for(var loop=0;loop< count;loop++){
        var voucherNo = strHelper.generateRandom(50).toUpperCase();

        voucherWallets.push({
            voucher_code: voucherNo,
            
            provider : ObjectID(),
            is_active : true,
            created_at :  moment().utc().toDate(),
            created_by : req.userId
        });
    }


    do{        
        var voucherData = await Voucher.findOne({_id: ObjectID(voucherid), is_active:true }).exec();  


        if(voucherData == null)
            return apihelper.APIResponseOK(res, false, "Voucher tidak valid",undefined);

        for(var tmp in voucherWallets)
            voucherWallets[tmp].voucher = voucherData._id;

        var updateres = {nModified:0};

        let session = await mongoose.startSession();
        try{
            //#Update#
            await session.withTransaction(async () => {
                await VoucherWallet.create(voucherWallets,{session: session});
                console.log("Update Vouccher");
                updateres = await Voucher.update({_id:voucherData._id, __v: voucherData.__v }, {$inc: {wallet_count: count,__v:1}},{session: session});
                console.log("Update Vouccher End");

                if (updateres.nModified == 0) {
                    throw new Error("Tidak dapat mengupdate data voucher, silahkan coba kembali");
                }
            });
            return apihelper.APIResponseOK(res, true,"Generate voucher berhasil",undefined);    
        }catch(exc){
            return apihelper.APIResponseOK(res, false, exc.message,undefined);    
        }finally{
            session.endSession();
        }
    } while (updateres.nModified == 0);
}))


router.delete("/:id", apihelper.authAccessOr({
    VOUCHER:config.action.Delete
}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var currentData = await Voucher.findById(id).lean().exec();
    if(currentData == null)
        return apihelper.APIResponseOK(res, false,"Invalid Data Id",undefined);        

    if(currentData.wallet_count > 0 || currentData.purchase_count>0)
        return apihelper.APIResponseOK(res, false,"Voucher ini tidak dapat di delete karena wallet > 0",undefined);        
    
    if(currentData.wallet_count > 0){
        return apihelper.APIResponseOK(res, false,"Tidak dapat di delete, Telah terdapat voucher wallet sebanyak " + currentData.wallet_count,undefined);        
    }

    var result = await Voucher.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))





//Ambil data voucher wallet
router.get("/wallet/:voucherId", apihelper.authAccessOr({
    VOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,status, sb,sd} = req.query;
    
    var finalQuery = {};
    if(searchquery){
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({"user_data.nama" : q});
        finalQuery["$or"].push({"provider_data.name" : q});
        finalQuery["$or"].push({voucher_code : q});
        finalQuery["$or"].push({purchase_note : q});
        finalQuery["$or"].push({source : q});    
    }

    if(status == "WALLET"){
        finalQuery.purchase_date = null;
        finalQuery.user = null;
    }else if(status == "PURCHASED"){
        finalQuery.purchase_date = {$ne: null};
        finalQuery.user = {$ne: null};
    }else if(status == "INTRANSACTION"){
        finalQuery.purchase_date = {$ne: null};    
        finalQuery.user = null;
    }


    var result = await VoucherWallet.aggregate([
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user_data"
        }}, 
        {$unwind: {
            "path": "$user_data",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "hospital",
            localField:"provider",
            foreignField:"_id",
            as:"provider_data"
        }},         
        {$unwind: {
            "path": "$provider_data",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "admin",
            localField:"created_by",
            foreignField:"_id",
            as:"created_by_user"
        }}, 
        {$match : finalQuery},
        {$unwind: {
            "path": "$created_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        { $project: {'_id':1,'voucher_code':1,'purchase_date':1,'source':1,'purchase_note':1,'voucher':1,'provider':1,'expired_date':1,    
                     'user_data._id':1,'user_data.nama':1,'provider_data._id':1,'provider_data.name':1, 
                     'used_date':1,
                     'created_at':1,'created_by_user._id':1,'created_by_user.name':1
        }},
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


router.get("/wallet/detail/:id", apihelper.authAccessOr({
    VOUCHERWALLET :config.action.View | config.action.Update | config.action.Delete,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;
    
    var ObjectId = require('mongoose').Types.ObjectId; 

    var finalQuery = {
        _id:new ObjectId(dataid)
    };
    

    var result = await VoucherWallet.aggregate([
        {$match : finalQuery},
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user_data"
        }}, 
        {$unwind: {
            "path": "$user_data",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "hospital",
            localField:"provider",
            foreignField:"_id",
            as:"provider_data"
        }},         
        {$unwind: {
            "path": "$provider_data",
            "preserveNullAndEmptyArrays": true
        }},
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
            localField:"revoke_by",
            foreignField:"_id",
            as:"revoke_by_user"
        }}, 
        {$unwind: {
            "path": "$revoke_by_user",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "OrderTransaction",
            localField:"purchase_transaction_id",
            foreignField:"_id",
            as:"transaction_data"
        }}, 
        {$unwind: {
            "path": "$transaction_data",
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
        
        { $project: {'_id':1,'voucher_code':1,'purchase_date':1,'source':1,'purchase_note':1,'voucher':1,'provider':1,'expired_date':1,    
                      'activate_date':1,'user_data._id':1,'user_data.nama':1,'provider_data._id':1,'provider_data.name':1, 
                     'used_date':1,'transaction_data.transaction_no':1,'transaction_data._id':1,'voucher_data.name':1,'voucher_data._id':1,
                     'created_at':1,'created_by_user._id':1,'created_by_user.name':1
        }}
    ]).exec();

    
    if(result != null && result.length > 0){
        return apihelper.APIResponseOK(res,true,"",result[0]);
    }else {
        return apihelper.APIResponseOK(res,false,"",undefined);
    }

}))


router.post("/wallet/revoke/:id", apihelper.auth({
    VOUCHERWALLET : config.action.Update,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;
    const reason = req.body.reason;
    
    var ObjectId = require('mongoose').Types.ObjectId; 

    var voucherWalletData = await VoucherWallet.findOne({_id:new ObjectId(dataid)}).lean().exec();
    if(Boolean(voucherWalletData.used_date) || Boolean(voucherWalletData.revoke_date)) {
        return apihelper.APIResponseOK(res,false,"Voucher telah digunakan atau telah di revoke, tidak dapat di revoke",undefined);
    }else{
        //boleh update kalau blm di gunakan        
        var updateres = await VoucherWallet.update({_id:voucherWalletData._id, __v: voucherWalletData.__v }, {
            $inc: {__v:1},
            revoke_by: req.user,
            revoke_date: moment().utc().toDate(),
            revoke_reason: reason
        });

        if (updateres.nModified == 0) {
            return apihelper.APIResponseOK(res,false,"Silahkan coba kembali, data tidak di temukan atau telah di rubah orang lain",undefined);
        } else {
            return apihelper.APIResponseOK(res, true,"voucher  berhasil di revoke",undefined);    
        }
    }
    
}))

module.exports = router;