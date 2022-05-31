const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const CompanyPolicyDepositSchema = new Schema({
    company: {
        type: Schema.Types.ObjectId,
        ref: "company"
    },
    company_policy: {
        type: Schema.Types.ObjectId,
        ref: "CompanyPolicy"
    },
    note : {
        type : String,
        required : false,
    },
    transaction_date : {
        type : Date,
        required : true,  
    },
    amount : {
        type : Number,
        required : true,  
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

CompanyPolicyDepositSchema.plugin(mongoosePaginate)
const CompanyPolicyDeposit = mongoose.model("CompanyPolicyDeposit", CompanyPolicyDepositSchema);
module.exports = CompanyPolicyDeposit;