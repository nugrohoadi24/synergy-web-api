const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const HistorySchema = new Schema({
    title : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    type : {
        type : String,
        required : true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    updated_at : {
        type : Date
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    created_at : {
        type : Date,
        required : true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : true
    }
},{skipVersioning: { dontVersionMe: true }})
HistorySchema.plugin(mongoosePaginate)
const History = mongoose.model("history", HistorySchema);
module.exports = History;