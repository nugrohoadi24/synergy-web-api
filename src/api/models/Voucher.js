const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ProductCategory = require('../models/ProductCategory');

const mongoosePaginate = require('mongoose-paginate');

const VoucherSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    short_description : {
        type : String,
        required : false,
    },
    description : {
        type : String,
        required : true,
    },
    category : {
        type : [Schema.Types.ObjectId],
        ref : "ProductCategory",
        required : true,
    },
    cara_pakai : {
        type : String,
        required : false,
    },
    syarat_ketentuan : {
        type : String,
        required : false,
    },
    image : {
        type : String,
        required : false
    },
    limit_days : {
        type : Number,
        required : true
    },    
    packet_days : {
        type : Number,
        required : false
    },  
    end_date : {
        type : Date,
        required : true
    },
    price : {
        type : Number,
        required : true
    },   
    wallet_count: {
        type : Number,
    },

    purchase_count: {
        type : Number,
    },
    redeem_count: {
        type : Number,
    },
    intransaction_count: {
        type : Number,
    },

    is_active : {
        type : Boolean,
        required : true,
        default:false
    },
    provider: {
        type: Schema.Types.ObjectId,
        ref: "hospital"
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


VoucherSchema.plugin(mongoosePaginate)
const Voucher = mongoose.model("voucher", VoucherSchema);
module.exports = Voucher;