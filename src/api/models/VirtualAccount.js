const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const VirtualAccountPaymentSchema = new Schema({
    va_payment_callback_id : {
        type: String,
        required: false
    },
    va_payment_xendit_id : {
        type : String,
        required : false,  
    },
    va_payment_received_at : {
        type : Date
    },
}, {skipVersioning: { dontVersionMe: true }})

const VirtualAccountSchema = new Schema({
    va_status : {
        type: String,
        required: false
    },
    va_xendit_id : {
        type: String,
        required: false
    },
    va_xendit_bank_code : {
        type: String,
        required: false
    },
    va_xendit_owner_id : {
        type: String,
        required: false
    },
    va_xendit_external_id : {
        type: String,
        required: false
    },
    va_is_locked : {
        type: Boolean,
        required: false
    },
    va_currency : {
        type: String,
        required: false
    },
    va_transaction_id : {
        type: Schema.Types.ObjectId,
        ref: "OrderTransaction",
        required: false
    },
    va_bank_name : {
        type: String,
        required: false
    },
    va_number : {
        type: String,
        required: false
    },
    va_requester : {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    va_expired_at : {
        type: Date
    },
    created_at : {
        type : Date
    },
    updated_at : {
        type : Date
    },
    va_payment_data : [VirtualAccountPaymentSchema]
}, {skipVersioning: { dontVersionMe: true }})

VirtualAccountSchema.plugin(mongoosePaginate)
const VirtualAccount = mongoose.model("VirtualAccount", VirtualAccountSchema);
module.exports = VirtualAccount;