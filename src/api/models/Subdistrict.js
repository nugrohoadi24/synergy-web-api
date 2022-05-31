const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const Subdistrictschema = new Schema({
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

    district: {
        type : String,
        required : true
    }

},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
Subdistrictschema.plugin(mongoosePaginate)
const Subdistrict = mongoose.model("subdistrict", Subdistrictschema);
module.exports = Subdistrict;