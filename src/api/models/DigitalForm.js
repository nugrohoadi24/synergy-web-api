const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const SubmitReasonIncidentSchema = new Schema({
    incident_no_sim : {
        type: String,
        required: false,
    },
    incident_location : {
        type: String,
        required: false,
    },
    incident_date : {
        type: String,
        required: false,
    },
    incident_hour : {
        type: String,
        required: false,
    },
    incident_chronogical : {
        type: String,
        required: false,
    },
    incident_cause : {
        type: String,
        required: false,
    },
    incident_body_part_injured : {
        type: String,
        required: false,
    }
}, {skipVersioning: { dontVersionMe: true }})

const SubmitReasonSickSchema = new Schema ({

    sick_recognized_at : {
        type: String,
        required: false,
    },
    sick_chronogical : {
        type: String,
        required: false,
    }

}, {skipVersioning: { dontVersionMe: true }})

const ReporterDetailSchema = new Schema ({

    reporter_name : {
        type: String,
        required: false
    },
    reporter_nik : {
        type: String,
        required: false
    },
    reporter_phone_number : {
        type: String,
        required: false
    },
    reporter_email : {
        type: String,
        required: false
    },
    reporter_relation : {
        type: String,
        required: false
    },
    reporter_address : {
        type: String,
        required: false
    }


}, {skipVersioning: { dontVersionMe: true }})

const BankAccSchema = new Schema ({

    bank_name : {
        type: String,
        required: false
    },
    bank_acc_name : {
        type: String,
        required: false
    },
    bank_acc_number : {
        type: String,
        required: false
    }

}, {skipVersioning: { dontVersionMe: true }})

const FormDocumentSchema = new Schema({
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
}, {skipVersioning: { dontVersionMe: true }})

const DigitalFormSchema = new Schema({

    form_submit_no : {
        type: String,
        require: false
    },
    form_claim_no : {
        type: String,
        require: false
    },
    form_type : {
        type: String,
        required: true
    },
    form_status : {
        type: String,
        required: false
    },
    form_participant_name : {
        type: String,
        required: false
    },
    form_participant_phone_number : {
        type: String,
        required: false
    },
    form_participant_email : {
        type: String,
        required: false
    },
    form_identity_card_no : {
        type: String,
        required: false
    },
    form_participant_user_id : {
        type: String,
        required: false
    },
    form_reason_submit : {
        type : String,
        required: false
    },
    form_reporter : {
        type: String,
        required: false
    },
    form_submit_signature : {
        type: String,
        required: false
    },
    form_certificate_no : {
        type: Schema.Types.ObjectId,
        ref: "UserPolicy",
        required: false
    },
    form_participant_hospital : {
        type: Schema.Types.ObjectId,
        ref: "hospital",
        required: false
    },
    form_user_submit : {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    form_company_affliation : {
        type: Schema.Types.ObjectId,
        ref: "company",
        required: false
    },
    form_reason_incident_detail: [SubmitReasonIncidentSchema],
    form_reason_sick_detail: [SubmitReasonSickSchema],
    form_reporter_detail : [ReporterDetailSchema],
    form_participant_bank_acc : [BankAccSchema],
    form_attachement : [FormDocumentSchema],
    created_at : {
        type: Date
    },
    updated_at : {
        type: Date
    }

}, {skipVersioning: { dontVersionMe: true }})

DigitalFormSchema.plugin(mongoosePaginate)
const DigitalForm = mongoose.model("DigitalForm", DigitalFormSchema);
module.exports = DigitalForm;