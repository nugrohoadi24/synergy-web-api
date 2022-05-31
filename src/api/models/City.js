const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const CitySchema = new Schema({
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
    province: {
        type: String,
        required : true
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })
CitySchema.plugin(mongoosePaginate)
const City = mongoose.model("city", CitySchema);
module.exports = City;