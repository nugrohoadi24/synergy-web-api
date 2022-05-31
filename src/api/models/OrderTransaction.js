const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const OrderItem = new Schema({
    voucher: {
        type: Schema.Types.ObjectId,
        ref: "voucher"
    },
    quantity : {
        type : Number,
        required : true
    },    
    price : {
        type : Number,
        required : true
    },
    subtotal : {
        type : Number,
        required : true
    },
},{_id : false,skipVersioning: { dontVersionMe: true }})


const OrderTransactionSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required : true
    },
    status : {
        type : String,
        required : true
    },
    transaction_no : {
        type : String,
        required : true
    },
    items:[OrderItem],
    invoice_no : {
        type : String,
        required : true
    },
    payment_type : {
        type : String,
        required : true
    },    
    payment_to_note : {
        type : String,
    },
 
    payment_date : {
        type : Date
    },
    payment_note : {
        type : String,
    },


    user_confirm_payment_image : {
        type : String,
    },
    user_confirm_payment_date : {
        type : Date
    },

    confirm_payment_date : {
        type : Date
    },
    payment_confirm_by : {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },

    subtotal : {
        type : Number,
        required : true
    },
    transaction_fee : {
        type : Number,
        required : true
    },
    grant_total : {
        type : Number,
        required : true
    },
    total_item : {
        type : Number,
        required : true
    },
    expired_at : {
        type : Date
    },
    updated_at : {
        type : Date
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    created_at : {
        type : Date
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    virtual_account: {
        type: Schema.Types.ObjectId,
        ref: "VirtualAccount",
        required: false
    },
    e_wallet: {
        type: Schema.Types.ObjectId,
        ref: "ElectronicWallet",
        required: false
    },
    membership_data : {
        type: Schema.Types.ObjectId,
        ref: "Membership",
        required: false
    }
},{skipVersioning: { dontVersionMe: true }})

OrderTransactionSchema.plugin(mongoosePaginate)
const OrderTransaction = mongoose.model("OrderTransaction", OrderTransactionSchema);
module.exports = OrderTransaction;