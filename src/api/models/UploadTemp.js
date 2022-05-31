const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UploadTempSchema = new Schema({
    name : {
        type : String,
        required : true
    },
    size : {
        type : Number,
    },
    mimetype : {
        type : String,
    },
    path : {
        type : String,
    },
    
    created_at : {
        type : Date
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    }
},{skipVersioning: { dontVersionMe: true }})

const UploadTemp = mongoose.model("upload_temp", UploadTempSchema);
module.exports = UploadTemp;