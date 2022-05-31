const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const benefit_detail_usage = new Schema({
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    value : {
        type : Number,
        required : false
    },    
    availableValue : {
        type : Number,
        required : false
    },
    limitValue : {
        type : Number,
        required : false
    },
    valueType : {
        type : String,
        required : false
    },    
    durationType : {
        type : String,
        required : false
    },
},{_id : false,skipVersioning: { dontVersionMe: true }})



const benefit_detail = new Schema({
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    unit_price_limit : {
        type : String,
        required : false
    },
    unit_name : {
        type : String,
        required : false
    },

    usage1 : {
        type : benefit_detail_usage,
        required : false
    },    
    usage2 : {
        type : benefit_detail_usage,
        required : false
    },
},{skipVersioning: { dontVersionMe: true }})


const request_claim_note = new Schema({
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    note : {
        type : String,
        required : false
    }
},{skipVersioning: { dontVersionMe: true }})



const ClaimValueSchema = new Schema({
    benefit: {
        type: Schema.Types.ObjectId,
        ref: "benefit"
    },
    claim_amount : {
        type : Number,
        required : false
    },    
    claim_jumlah : {
        type : Number,
        required : false
    },
    covered_amount : {
        type : Number,
        required : false
    },    
    covered_jumlah : {
        type : Number,
        required : false
    },
    claim_note : {
        type : String,
        required : false
    }
},{skipVersioning: { dontVersionMe: true }})

const claimDocumentSchema = new Schema({
    size :{
        type : Number,
        required : false,  
    },
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
    } ,
    upload_at : {
        type : Date
    },
    upload_by : {
        type : String
    }
}, {skipVersioning: { dontVersionMe: true }})

const UserClaimSchema = new Schema({    
    user: {
        type: Schema.Types.ObjectId,
        ref: "user",
        required : true
    },
    user_id : {
        type : String,
        required : false,  
    },
    card_no : {
        type : String,
        required : false,  
    },
    user_name : {
        type : String,
        required : false,  
    },
    policy: {
        type: Schema.Types.ObjectId,
        ref: "UserPolicy",
        required : true
    },
    nama_tertanggung: {
        type: String,
        ref: "UserPolicy.nama_tertanggung",
        required : false
    },
    hospital : {
        type: Schema.Types.ObjectId,
        ref: "hospital",
        required : true,  
    },
    doctor_name : {
        type : String,
        required : false,  
    },
    request_claim_date : {
        type : Date,
        required : true,  
    },
    claim_date : {
        type : Date,
        required : false,  
    },
    claim_total_amount : {
        type : Number,
        required : false,  
    },
    covered_total_amount : {
        type : Number,
        required : false,  
    },
    excess_total_amount : {
        type : Number,
        required : false,  
    },
    

    processed_by : {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    processsed_date : {
        type : Date,
        required : false, 
    },

    rejected_by : {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    rejected_date : {
        type : Date,
        required : false, 
    },


    diagnose_note : {
        type : String,
        required : false,  
    },
    diagnose : {
        type: Schema.Types.ObjectId,
        ref: "diagnosa"
    },
    image_attachment : [
        String
    ],
    claim:[ClaimValueSchema],
    claim_status : {
        type : String,
        required : true,  
    },
    cashless : {
        type : Boolean,
        required : true
    },
    claim_no : {
        type : String,
        required : false
    },
    accident_description : {
        type : String,
        required : false
    },
    claim_reason : {
        type : String,
        required : false
    },
    requester_name : {
        type : String,
        required : false
    },
    requester_phone : {
        type : String,
        required : false
    },
    requester_email : {
        type : String,
        required : false
    },
    requester_relation : {
        type : String,
        required : false
    },
    requester_nik : {
        type : String,
        required : false
    },
    requester_product_type : {
        type : String,
        required : false
    },
    incident_date : {
        type : String,
        required : false
    },
    incident_body_part_injured : {
        type : String,
        required : false
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : true
    },

    input_claim_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    input_claim_at : {
        type : Date,
        required : false, 
    },
    claim_form_received_date : {
        type : Date,
        required : false, 
    },
    complete_date : {
        type : Date,
        required : false, 
    },
    paid_date : {
        type : Date,
        required : false, 
    },
    admission_date : {
        type : Date,
        required : false, 
    },
    discharge_date : {
        type : Date,
        required : false, 
    },
    closure_remark : {
        type : String,
        required : false
    },
    
    surat_jaminan_masuk_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    surat_jaminan_masuk_at : {
        type : Date,
        required : false, 
    },
    surat_jaminan_masuk_no : {
        type : String,
        required : false
    },
    
    surat_jaminan_keluar_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    surat_jaminan_keluar_at : {
        type : Date,
        required : false, 
    },
    surat_jaminan_keluar_no : {
        type : String,
        required : false
    },
    spb_file_name : {
        type : String,
        required : false
    },
    surat_perkiraan_biaya_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    surat_perkiraan_biaya_at : {
        type : Date,
        required : false, 
    },
    surat_perkiraan_biaya_no : {
        type : String,
        required : false
    },
    sjp_file_name : {
        type : String,
        required : false
    },
    surat_jaminan_keluar_sent_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    surat_jaminan_keluar_sent_at : {
        type : Date,
        required : false, 
    },
    sjm_file_name : {
        type : String,
        required : false
    },
    surat_jaminan_masuk_sent_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : false
    },
    surat_jaminan_masuk_sent_at : {
        type : Date,
        required : false, 
    },
    policy_benefit_detail : [benefit_detail],
    request_claim_note :[request_claim_note],
    document :[claimDocumentSchema],
    company_policy : {
        type : String,
        required : false
    },
    insurance_product_name : {
        type : String,
        required : false
    },
   
    insurance_product_plan_name : {
        type : String,
        required : false
    },
    insurance_product_type : {
        type : String,
        required : false
    },
    insurance_product_reject_note : {
        type: String,
        required: false
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
    yearly_usage_limit : {
        type : Number,
        required : false
    },
    yearly_usage : {
        type : Number,
        required : false
    },
},{skipVersioning: { dontVersionMe: true } })


UserClaimSchema.plugin(mongoosePaginate)
const UserClaim = mongoose.model("user_claim", UserClaimSchema);
module.exports = UserClaim;