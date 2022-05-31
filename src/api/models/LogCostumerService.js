const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const logCostumerServiceSchema = new Schema({
    caller_name : {
        type: String,
        required: true
    },
    caller_phone_number : {
        type: String,
        trim: true,
        required: true
    },
    caller_question_category : {
        type: String,
        required: true
    },
    caller_note : {
        type: String,
        required: false
    },
    caller_handled_by : {
        type: String,
        required: false
    },
    caller_handler_id : {
        type: Schema.Types.ObjectId,
        ref: "user",
        required: false
    },
    caller_current_status : {
        type: String,
        required: true
    },
    created_at : {
        type : Date
    },
    updated_at : {
        type : Date
    }
},{skipVersioning: { dontVersionMe: true }})

logCostumerServiceSchema.plugin(mongoosePaginate)
const LogCostumerService = mongoose.model("LogCostumerService", logCostumerServiceSchema);
module.exports = LogCostumerService;