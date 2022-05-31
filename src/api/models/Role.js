const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const roleschema = new Schema({
    code : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    access: {
        type: Map,
        of: Number
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })

roleschema.plugin(mongoosePaginate)
const Role = mongoose.model("role", roleschema);
module.exports = Role;