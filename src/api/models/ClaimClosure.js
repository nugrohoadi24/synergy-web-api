const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const ClaimClosureSchema = new Schema({
    closure_action : {
        type : String,
        required : true
    },
    note : {
        type : String,
        required : true
    },
    user_claim: {
        type: Schema.Types.ObjectId,
        ref: "user_claim"
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
},{skipVersioning: { dontVersionMe: true }})

ClaimClosureSchema.plugin(mongoosePaginate)
const ClaimClosure = mongoose.model("claim_closure", ClaimClosureSchema);
module.exports = ClaimClosure;