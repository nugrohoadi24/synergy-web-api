const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const Districtschema = new Schema({
    code : {
        type : String,
        required : true,
        index:true
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
    city: {
        type : String,
        required: true
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
Districtschema.plugin(mongoosePaginate)
const District = mongoose.model("district", Districtschema);
module.exports = District;