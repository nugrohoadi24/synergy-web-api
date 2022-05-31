const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const VoucherWalletDataSchema = new Schema({
    voucher_code : {
        type : String,
        required : true
    },
    user_id : {
        type : String,
        required : true
    },
    user : {
        type: Map, of: String
    },
    expired_date: {
        type : Date,
    },
    status: {
        type : String,
        required : true
    },
    errormsg: {
        type : String
    }
},{_id : false,skipVersioning: { dontVersionMe: true }})

const ImportVoucherWalletSchema = new Schema({    
    voucher : {
        type: Schema.Types.ObjectId,
        ref: "voucher"
    },
    voucher_data : {
        type: Map, of: String
    },
    data:[VoucherWalletDataSchema],
    success_count: {
        type : Number,
        required : true
    },    
    failed_count: {
        type : Number,
        required : true
    },
    data_count: {
        type : Number,
        required : true
    },
    status: {
        type : String,
        required : true
    },    
    note: {
        type : String,
    },

    file_path: {
        type : String,
    },
    approved_at : {
        type : Date
    },
    approved_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    approved_status: {
        type : String,
    },

    updated_at : {
        type : Date
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    created_at : {
        type : Date
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    }
},{skipVersioning: { dontVersionMe: true }})

ImportVoucherWalletSchema.plugin(mongoosePaginate)
const ImportVoucherWallet = mongoose.model("ImportVoucherWallet", ImportVoucherWalletSchema);
module.exports = ImportVoucherWallet;