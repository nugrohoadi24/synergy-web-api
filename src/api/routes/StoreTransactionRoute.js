const config = require('../config/config');
const strHelper = require('../helper/StringHelper');
const apihelper = require('../helper/APIHelper');
const router = require('express').Router();
const ImportVoucher = require('../models/ImportVoucherWallet');

const User = require('../models/User');
const Provider = require('../models/Hospital');
const Voucher = require('../models/Voucher');
const VoucherWallet = require('../models/VoucherWallet');
const OrderTransaction = require('../models/OrderTransaction');
const CounterSchema = require('../models/Counter');
const UploadTemp = require('../models/UploadTemp');
const Membership = require('../models/Membership')

var ObjectID = require('mongodb').ObjectID;
const mongoose = require('mongoose');
const moment = require("moment");



router.get("/", apihelper.authAccessOr({
    ORDERTRANSACTION:config.action.View | config.action.Update | config.action.Delete
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({"status" : q});
        finalQuery["$or"].push({"user.nama" : q});
        finalQuery["$or"].push({"user.email" : q});
        finalQuery["$or"].push({"status_desc.description" : q});
        finalQuery["$or"].push({"transaction_no" : q});
    }

    var queryO = [
        {$lookup: { 
            from: "OrderTransactionStatus",
            localField:"status",
            foreignField:"code",
            as:"status_desc"
        }}, 
        {$unwind: {
            "path": "$status_desc",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user"
        }}, 
        {$unwind: {
            "path": "$user",
            "preserveNullAndEmptyArrays": true
        }},

        {$match : finalQuery},        
    ];

    var sorto = {};
	if(!apihelper.isEmptyObj(sb)){
		if(sb.charAt(0) == '-')
			sorto[sb.substring(1)] = -1;
		else
			sorto[sb] = 1;

		queryO.push({$sort: sorto});
	}else{
        queryO.push({$sort: {'created_at' : -1}});
    }


    queryO.push({
        $facet: {
            docs: [{ $skip: (parseInt(page)-1) * parseInt(perpage) }, { $limit: parseInt(perpage) }],
            totalCount: [{
                $count: 'count'
            }]
        }
    });

    var result = await OrderTransaction.aggregate(queryO).exec();

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



router.get("/detail/:id", apihelper.authAccessOr({
    ORDERTRANSACTION :config.action.View | config.action.Update | config.action.Delete
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;

    var result = await OrderTransaction.aggregate([
        {$match : {_id:ObjectID(dataid)}}, 
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user"
        }},
        {$unwind: {
            "path": "$user",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "admin",
            localField:"payment_confirm_by",
            foreignField:"_id",
            as:"payment_confirm_by_data"
        }},         
        {$unwind: {
            "path": "$payment_confirm_by_data",
            "preserveNullAndEmptyArrays": true
        }},
        {$lookup: { 
            from: "Membership",
            localField:"membership_data",
            foreignField:"_id",
            as:"member_data"
        }},         
        {$unwind: {
            "path": "$member_data",
            "preserveNullAndEmptyArrays": true
        }},

        {$project: {'_id':1,'user.nama':1,'user.email':1,'user.userId':1,'user.handphone':1,'status':1,'items':1,
                    'payment_type':1,'total_item':1,'created_at':1,'updated_at':1,'updated_by':1,'expired_at':1,'transaction_fee':1,
                    'grant_total':1,'transaction_no':1,'invoice_no':1,'subtotal':1,'transaction_fee':1,'payment_type':1,
                    'confirm_payment_date':1,'payment_confirm_by_data.name':1,'payment_confirm_by_data._id':1,
                    'user_confirm_payment_date':1,'user_confirm_payment_image':1, 'member_data': 1}}
    ]).exec();
    
    if(result != null && result.length > 0){

        for(var x = 0;x < result[0].items.length;x++){
            var item = result[0].items[x];
            if(Boolean(item.voucher)) {
                item.voucher_data = await Voucher.findById({_id:ObjectID(item.voucher)},"name provider").exec();
                if(Boolean(item.voucher_data))
                    item.voucher_data.provider = await Provider.findById({_id:ObjectID(item.voucher_data.provider)},"name provider").exec();
            }

        }

        return apihelper.APIResponseOK(res,true,"",result[0]);
    }else {
        return apihelper.APIResponseOK(res,false,"",undefined);
    }

}))


router.post("/confirmpayment/:id", apihelper.auth({
    ORDERTRANSACTION : config.action.Update
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;
    var data = {}
    var finalQuery = {_id:dataid}

    var dataOrder = await OrderTransaction.findOne({_id:dataid},"_id status").exec();  
    console.log(dataOrder)

    if(apihelper.isEmptyObj(dataid)){
        return apihelper.APIResponseBR(res, false, "id pada parameter tidak boleh kosong",undefined);
    }
    if(dataOrder.status != config.transaction_status.PAID){
        return apihelper.APIResponseBR(res, false, "Transaksi ini belum dibayar oleh user",undefined);
    }

    data.confirm_payment_date = moment().utc().toDate()
    data.status = config.transaction_status.CONFIRMED

    var result = await OrderTransaction.findByIdAndUpdate({_id: ObjectID(dataid)},data,{
        upsert:true
    }).exec(); 

    if(result){
        return apihelper.APIResponseOK(res,true,"Status Transaksi Berhasil Diperbarui",undefined);
    }else{
        return apihelper.APIResponseNF(res,false,"Tidak Dapat Memperbarui Transaksi Ini, Silahkan coba kembali.",undefined);
    }
   
    
}))

router.post("/complete_order/:id", apihelper.auth({ORDERTRANSACTION : config.action.Update}), apihelper.handleErrorAsync(async (req,res, next) => {
    const dataid = req.params.id;

    var currentOrderData = await OrderTransaction.findById({_id:ObjectID(dataid)}).exec();

    if(currentOrderData!=null){
        if(currentOrderData.status != config.transaction_status.CONFIRMED)
            return apihelper.APIResponseOK(res,false,"Transaksi ini statusnya belum PAYMENT_CONFIRMED",undefined);
    }else{
        return apihelper.APIResponseOK(res,false,"Data tidak ditemukan",undefined);
    }

    var isMembership = false
    if(currentOrderData.membership_data != undefined){
        isMembership = true

        var mbUpdate = await Membership.findOneAndUpdate({_id: currentOrderData.membership_data}, {membership_status : "ACTIVE"}).exec()
    }


    var updateres = {nModified:0};

    let session = await mongoose.startSession();
    try{

        //#Update# agar berbeda dengna tutor karena di tutor gk jalan
		await session.withTransaction(async () => {

            var result = await OrderTransaction.findOneAndUpdate({_id:currentOrderData._id}, {
                status: config.transaction_status.FINISHED,
                payment_confirm_by: req.user
            },{session }).exec();     
            

            for(var x=0; x<currentOrderData.items.length; x++){
                //Looping
                var item = currentOrderData.items[x];
                if(Boolean(item.voucher)){            

                    var availableWallet = await VoucherWallet.find({voucher: item.voucher, purchase_transaction_id: null, revoke_date:null}).exec();
                    var counter = 0;
                    var fullfiledCount = 0;
                    //Looping sebanyak jumlah voucher untuk book voucher
                    if(availableWallet !=null && availableWallet.length >= item.quantity){
                        for(var idx = 0; idx< item.quantity; idx++){
                            {
                                var tmpWallet = availableWallet[counter];

                                var updateresVoucherWallet = await VoucherWallet.update({_id: tmpWallet._id, __v: tmpWallet.__v}, {
                                    $inc: {
                                        intransaction_count: -item.quantity, 
                                        purchase_count: item.quantity,
                                        __v:1
                                    },
                                    is_membership: isMembership,
                                    purchase_transaction_id: currentOrderData._id,
                                    purchase_note: "TRANSACTION",
                                    purchase_date: moment().utc().toDate(),
                                    user: currentOrderData.user,
                                    status : config.voucher_wallet_status.NEW
                                },{session: session});

                                counter++;
                                if(updateresVoucherWallet.nModified ==1)
                                    fullfiledCount++;
                            } while(availableWallet.length < counter &&  updateresVoucherWallet.nModified == 0);
                        }
                    }else{
                        throw new Error("Maaf, Voucher wallet sudah tidak memiliki voucher kosong yg cukup. Jumlah wallet kosong " + availableWallet.length);
                    }

                    //Tidak semua wallet dapat di book
                    if(fullfiledCount != item.quantity){
                        throw new Error("Maaf, Voucher wallet sudah tidak memiliki voucher kosong yg cukup. Jumlah wallet kosong " + availableWallet.length);
                    }

                    {
                        currentVoucherData = await Voucher.findById({_id: ObjectID(item.voucher)}).exec();                          
                        var updateData = {
                            $inc: {
                                intransaction_count: -item.quantity, 
                                purchase_count: item.quantity,
                                __v:1
                            }
                        }
                
                        updateres = await Voucher.update({_id: ObjectID(item.voucher), __v: currentVoucherData.__v}, updateData,
                        {session: session});
        
                        if(updateres.nModified == 0)
                            apihelper.sleep(100);
                        
                    } while (updateres.nModified == 0);
                }
            }                
        });

        return apihelper.APIResponseOK(res, true,"Transaksi dengan no " + currentOrderData.transaction_no + " telah berhasil di update",null);
    }catch(exc){
        return apihelper.APIResponseOK(res, false, exc.message,undefined);    
    }finally{
        session.endSession();
    }
}))



router.post("/rejectpayment/:id", apihelper.auth({
    ORDERTRANSACTION : config.action.Update,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;

    var currentOrderData = await OrderTransaction.findById({_id:ObjectID(dataid)}).exec();

    if(currentOrderData!=null){
        if(currentOrderData.status != config.transaction_status.CONFIRMED)
            return apihelper.APIResponseOK(res,false,"Transaksi ini statusnya tidak dapat di reject, hanya transaksi yg status yg telah konfirmasi yg dapat di reject",undefined);
    }else{
        return apihelper.APIResponseOK(res,false,"Data tidak ditemukan",undefined);
    }

    var updateres = {nModified:0};

    let session = await mongoose.startSession();
    try{

        //#Update# agar berbeda dengna tutor karena di tutor gk jalan
		await session.withTransaction(async () => {

            var result = await OrderTransaction.findOneAndUpdate({_id:currentOrderData._id}, {
                status: config.transaction_status.REJECT_PAYMENT,
                confirm_payment_date: null,
                payment_confirm_by: null,
                user_confirm_payment_image:null
            },{session }).exec();                    
        });

        return apihelper.APIResponseOK(res, true,"Transaksi dengan no " + currentOrderData.transaction_no + " telah berhasil di reject",null);
    }catch(exc){
        return apihelper.APIResponseOK(res, false, exc.message,undefined);    
    }finally{
        session.endSession();
    }
    
}))


router.post("/cancel/:id", apihelper.auth({
    ORDERTRANSACTION : config.action.Update,
}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const dataid = req.params.id;

    var currentOrderData = await OrderTransaction.findById({_id:ObjectID(dataid)}).exec();

    if(currentOrderData!=null){
        if(currentOrderData.status == config.transaction_status.FINISHED || currentOrderData.status == config.transaction_status.CANCELED)
            return apihelper.APIResponseOK(res,false,"Transaksi ini statusnya tidak dapat di reject, hanya transaksi yg status yg telah konfirmasi yg dapat di reject",undefined);
    }else{
        return apihelper.APIResponseOK(res,false,"Data tidak ditemukan",undefined);
    }

    var updateres = {nModified:0};

    let session = await mongoose.startSession();
    try{

        //#Update# agar berbeda dengna tutor karena di tutor gk jalan
		await session.withTransaction(async () => {

            var result = await OrderTransaction.findOneAndUpdate({_id:currentOrderData._id}, {
                status: config.transaction_status.CANCELED,
                confirm_payment_date: moment().utc().toDate(),
                payment_confirm_by: req.user
            },{session }).exec();     
           
               
        });

        return apihelper.APIResponseOK(res, true,"Transaksi dengan no " + currentOrderData.transaction_no + " telah berhasil di cancel",null);
    }catch(exc){
        return apihelper.APIResponseOK(res, false, exc.message,undefined);    
    }finally{
        session.endSession();
    }
    
}))


module.exports = router;