const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const Provinceschema = new Schema({
    code : {
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
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
Provinceschema.plugin(mongoosePaginate)
const Province = mongoose.model("province", Provinceschema);
module.exports = Province;