const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const ClaimLimitOptionSchema = new Schema({
    key : {
        type : String,
        required : true,
        index:true
    },
    name : {
        type : String,
        required : true
    },
    valueType : {
        type : String,
        required : true
    },
    durationType : {
        type : String,
        required : true
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
ClaimLimitOptionSchema.plugin(mongoosePaginate)
const ClaimLimitOption = mongoose.model("claim_limit_options", ClaimLimitOptionSchema);
module.exports = ClaimLimitOption;