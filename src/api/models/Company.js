const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const CompanyDocumentSchema = new Schema({
    name :{
        type : String,
        required : false,  
    },
    mimetype :{
        type : String,
        required : false,  
    },
    path: {
        type : String,
        required : false,  
    },
    type : {
        type : String,
        required : false,  
    },
    size : {
        type : String,
        required : false
    },
    upload_at : {
        type : Date
    }
}, {skipVersioning: { dontVersionMe: true }})

const companyschema = new Schema({
    code : {
        type : String,
        required : true,
        index:true
    },
    name : {
        type : String,
        required : true
    },    
    is_active : {
        type : Boolean,
        required : true,
        default:false
    },
    company_npwp : {
        type : String,
        required: false
    },
    company_akta : {
        type : String,
        required: false
    },
    company_sop_nib : {
        type : String,
        required : false
    },
    company_ktp: {
        type : String,
        required : false
    },
    company_bank_acc_no : {
        type : String,
        required: false
    },
    company_attachement : [CompanyDocumentSchema],
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
companyschema.plugin(mongoosePaginate)
const Company = mongoose.model("company", companyschema);
module.exports = Company;