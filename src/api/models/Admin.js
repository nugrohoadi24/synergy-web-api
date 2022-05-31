const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const adminschema = new Schema({
    userid : {
        type : String,
        required : true,
        unique : true,
        index:true 
    },
    password : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    role : {
        type : String,
        required : true
    },
    is_active : {
        type : Boolean,
        required : true,
        default:false
    },
    role: {
        type: Schema.Types.ObjectId,
        ref: "role"
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })

adminschema.plugin(mongoosePaginate)
const Admin = mongoose.model("admin", adminschema);
module.exports = Admin;