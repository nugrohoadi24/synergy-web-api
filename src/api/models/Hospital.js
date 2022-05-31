const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const hospital_schema = new Schema({
    type : {
        type : String,
        required : false
    },
    code : {
        type : String,
        required : true
    },
    admin_email : {
        type : String,
        required : false
    },
    name : {
        type : String,
        required : true
    },
    address : {
        type : String,
        required : true
    },
    address_complete : {
        type : String,
        required : false
    },
    province : {
        type: Schema.Types.ObjectId,
        ref: "province",
        required : true
    },
    city : {
        type: Schema.Types.ObjectId,
        ref: "city",
        required : true
    },
    district : {
        type: Schema.Types.ObjectId,
        ref: "district",
        required : true
    },
    subdistrict : {
        type: Schema.Types.ObjectId,
        ref: "subdistrict",
        required : true
    },
    zipcode : {
        type : String,
        required : false
    },
    qrcode : {
        type : String,
        required : false
    },
    phone1 : {
        type : String,
        required : false
    }, 
    phone2 : {
        type : String,
        required : false
    },
    longitude : {
        type : Number,
        required : false
    },
    latitude : {
        type : Number,
        required : false
    },
    voucher_pin : {
        type : String,
        required : false
    },
    is_active : {
        type : Boolean,
        required : true,
        default:false
    },
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })

hospital_schema.plugin(mongoosePaginate)
const Hospital = mongoose.model("hospital", hospital_schema);
module.exports = Hospital;