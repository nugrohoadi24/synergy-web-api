const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const ImportUserPolicySchema = new Schema({    
    company_policy : {
        type : String
    },
    user_id : {
        type : String
    },
    certificate_no: {
        type : String
    },
    nama_tertanggung : {
        type : String,
        required : true,
    },
    nik_tertanggung : {
        type : String,
        required : false,
    },
    relation : {
        type : String,
        required : false,
    },
    gender_tertanggung : {
        type : String,
        required : false,
    },
    alamat_tertanggung : {
        type : String,
        required : false,
    },    
    card_no: {
        type : String
    },
    policy_date: {
        type : Date
    },
    policy_end_date: {
        type : Date
    },
    dob_tertanggung: {
        type : Date
    },    
    product_code: {
        type : String
    },
    plan_name: {
        type : String
    },
    product_type: {
        type : String
    },
    status: {
        type : String
    },
    status_message: {
        type : String
    }
}) 

ImportUserPolicySchema.plugin(mongoosePaginate)
const ImportUserPolicy = mongoose.model("import_user_policy", ImportUserPolicySchema);
module.exports = ImportUserPolicy;