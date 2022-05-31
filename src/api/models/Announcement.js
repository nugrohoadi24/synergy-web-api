const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const AnnouncementSchema = new Schema({
    title : {
        type : String,
        required : true
    },
    short_description : {
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
    show_at : {
        type : Date,
        required : true
    },
    is_active : {
        type : Boolean,
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
        type : Date,
        required : true
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin",
        required : true
    }
},{skipVersioning: { dontVersionMe: true }})
AnnouncementSchema.plugin(mongoosePaginate)
const Announcement = mongoose.model("announcement", AnnouncementSchema);
module.exports = Announcement;