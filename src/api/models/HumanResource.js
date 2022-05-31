const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const humanResourceSchema = new Schema({
    email : {
        type: String,
        required: true
    },
    company : {
        type: Schema.Types.ObjectId,
        ref: "company",
        required: true
    },
    password : {
        type : String,
        required : true
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
    created_at : {
        type: Date
    },
    updated_at : {
        type: Date
    }
},{skipVersioning: { dontVersionMe: true }})


humanResourceSchema.plugin(mongoosePaginate)
humanResourceSchema.plugin(AutoIncrement, {inc_field: 'userId'});
const HumanResource = mongoose.model("HumanResource", humanResourceSchema);
module.exports = HumanResource;