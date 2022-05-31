const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const CompanyPolicySchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: "company"
    },
    policy_no : {
        type : String,
        required : true,
        index: { unique: true }
    },
    note : {
        type : String,
        required : true,
    },
    policy_date : {
        type : Date,
        required : true,  
    },
    policy_end_date : {
        type : Date,
        required : true,  
    },
    is_active : {
        type: Boolean,
        required : true,
        default:true
    },
    is_used: {
        type: Boolean,
        required : true,
        default:false
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
    },
},{skipVersioning: { dontVersionMe: true } })

CompanyPolicySchema.plugin(mongoosePaginate)
const CompanyPolicy = mongoose.model("CompanyPolicy", CompanyPolicySchema);
module.exports = CompanyPolicy;