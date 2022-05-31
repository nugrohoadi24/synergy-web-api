const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const EWalletPaymentSchema = new Schema({
    wa_payment_reference_id : {
        type: String,
        required: false
    },
    wa_payment_mobile_web_url : {
        type : String,
        required : false  
    },
    wa_payment_dekstop_web_url : {
        type : String,
        required : false  
    },
    wa_payment_mobile_deeplink_url : {
        type : String,
        required : false  
    },
    wa_payment_qr_code_string : {
        type: String,
        required: false
    },
    wa_payment_received_at : {
        type : Date
    }
}, {skipVersioning: { dontVersionMe: true }})

const EWalletPropertiesSchema = new Schema({
    wa_properties_phone_number : {
        type: String,
        required: false
    },
    wa_properties_success_redirect_url : {
        type : String,
        required : false  
    },
    wa_properties_failure_redirect_url : {
        type : String,
        required : false  
    },
    wa_properties_cancel_redirect_url : {
        type : String,
        required : false  
    }
}, {skipVersioning: { dontVersionMe: true }})

const EWalletMetaDataSchema = new Schema({
    wa_metadata_transaction_no : {
        type: String,
        required: false
    },
    wa_metadata_transaction_amount : {
        type : String,
        required : false  
    },
    wa_metadata_transaction_date : {
        type : String,
        required : false  
    }
}, {skipVersioning: { dontVersionMe: true }})

const EWalletSchema = new Schema({
    wa_xendit_charge_id : {
        type: String,
        required: false
    },
    wa_xendit_business_id : {
        type: String,
        required: false
    },
    wa_xendit_reference_id : {
        type: String,
        required: false
    },
    wa_transaction_id : {
        type: Schema.Types.ObjectId,
        ref: "OrderTransaction",
        required: false
    },
    wa_status : {
        type : String,
        required : false 
    },
    wa_currency : {
        type : String,
        required : false  
    },
    wa_name : {
        type : String,
        required: false
    },
    wa_channel_code : {
        type: String,
        required: false
    },
    wa_charge_amount : {
        type: String,
        required: false
    },
    wa_capture_amount : {
        type : String,
        required: false
    },
    wa_refunded_amount : {
        type : String
    },
    wa_checkout_method: {
        type : String,
        required: false
    },
    created_at : {
        type : Date
    },
    updated_at : {
        type : Date
    },
    wa_properties : [EWalletPropertiesSchema],
    wa_metadata : [EWalletMetaDataSchema],
    wa_payment_data : [EWalletPaymentSchema]
}, {skipVersioning: { dontVersionMe: true }})

EWalletSchema.plugin(mongoosePaginate)
const EWallet = mongoose.model("ElectronicWallet", EWalletSchema);
module.exports = EWallet;