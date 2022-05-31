const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const VoucherWalletSchema = new Schema({
    is_membership : {
        type: Boolean,
        required: true,
        default: false
    },
    voucher_code : {
        type : String,
        required : true
    },
    user : {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    voucher : {
        type: Schema.Types.ObjectId,
        ref: "voucher"
    },

    purchase_date: {
        type : Date,
    },

    purchase_transaction_id: {
        type: Schema.Types.ObjectId,
        ref: "OrderTransaction"
    },

    purchase_note: {
        type : String,
    },
    
    expired_date: {
        type : Date,
    },
    used_date: {
        type : Date,
    },
    
    status: {
        type : String
    },
    
    provider: {
        type: Schema.Types.ObjectId,
        ref: "hospital"
    },

    revoke_date: {
        type : Date,
    },

    revoke_reason: {
        type : String
    },
    revoke_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },

    source : {
        type : String
    },

    upload_from_id : {
        type: Schema.Types.ObjectId,
        ref: "ImportVoucherWallet"
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
},{skipVersioning: { dontVersionMe: false }})

VoucherWalletSchema.plugin(mongoosePaginate)
const Voucher = mongoose.model("VoucherWallet", VoucherWalletSchema);
module.exports = Voucher;