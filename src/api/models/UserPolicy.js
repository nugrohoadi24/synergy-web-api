const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const benefit_usage_claim_history = new Schema({
    claim: {
        type: Schema.Types.ObjectId,
        ref: "user_claim"
    },
    usage_amount : {
        type : Number,
        required : true
    },    
    usage_jlh : {
        type : Number,
        required : true
    }
},{skipVersioning: { dontVersionMe: true },_id: false})

const benefit_yearly_usage_claim_history = new Schema({
    claim: {
        type: Schema.Types.ObjectId,
        ref: "user_claim"
    },
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    usage_amount : {
        type : Number,
        required : true
    },    
    usage_jlh : {
        type : Number,
        required : true
    }
},{skipVersioning: { dontVersionMe: true },_id: false})


const benefit_usage_value_schema = new Schema({
    period_start: {
        type: Date,
    },
    period_end: {
        type: Date,
    },

    usage_amount : {
        type : Number,
        required : true
    },    
    usage_jlh : {
        type : Number,
        required : true
    },
    claim_count : {
        type : Number,
        required : true
    },
    usage_by_type : {  // total nilai penggunaan yg sesuai dengan limit type 1 dan 2 
        type : Number,
        required : true
    },
    usage_valueType : {
        type : String,
        required : true
    },
    usage_durationType : {
        type : String,
        required : true
    },
    claim_history : [benefit_usage_claim_history]
},{skipVersioning: { dontVersionMe: true },_id: false})

const benefit_usage_schema = new Schema({
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    last_claim_date : { 
        type : Date,
        required : true,  
    },
    yearly_usage : {
        type: Number,
        required : true,
        default: 0
    },
    usage1:[benefit_usage_value_schema],
    usage2:[benefit_usage_value_schema]    
},{skipVersioning: { dontVersionMe: true }})


const benefit_usage_period_schema = new Schema({    
    period_start: {
        type: Date,
    },
    period_end: {
        type: Date,
    },
},{skipVersioning: { dontVersionMe: true }})

const UserPolicySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    certificate_no : {
        type : String,
        required : true,
        index: { unique: true }
    },
    nama_tertanggung : {
        type : String,
        required : true,
    },
    nik_tertanggung : {
        type : String,
        required : false,
    },
    alamat_tertanggung : {
        type : String,
        required : false,
    },    
    gender_tertanggung : {
        type : String,
        required : false,
    },    
    relation : {
        type : String,
        required : false,
    },    
    card_no : {
        type : String,
        required : false,
    },    
    policy_date : {
        type : Date,
        required : true,  
    },
    policy_end_date : {
        type : Date,
        required : true,  
    },
    dob_tertanggung : {
        type : Date,
        required : true,  
    },
    monthly_period :[benefit_usage_period_schema],
    quarter_period :[benefit_usage_period_schema],
    semester_period :[benefit_usage_period_schema],    
    insurance_product: {
        type: Schema.Types.ObjectId,
        ref: "insurance_product"
    },
    company_policy: {
        type: String,
        required : true,
    },
    plan_name : {
        type: String,
        required : false,
    },
    product_type : {
        type: String,
        required : false
    },
    benefit_usage:[benefit_usage_schema],
    yearly_usage : {
        type: Number,
        required : true,
        default: 0
    },    
    yearly_claim_history : [benefit_yearly_usage_claim_history],
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
    admin_policy_disable_at : {
        type : Date,  // tanggal admin disable polis di menu polis
        required : false,  
    },
    admin_policy_disable_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
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
},{skipVersioning: { dontVersionMe: true }})

UserPolicySchema.plugin(mongoosePaginate)
const UserPolicy = mongoose.model("UserPolicy", UserPolicySchema);
module.exports = UserPolicy;