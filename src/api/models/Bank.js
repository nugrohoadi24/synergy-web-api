const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const listBankSchema = new Schema({
    name : {
        type: String,
        required: true
    },
    code : {
        type: String,
        trim: true,
        required: true
    }
},{skipVersioning: { dontVersionMe: true }})

listBankSchema.plugin(mongoosePaginate)
const ListBank = mongoose.model("bank", listBankSchema);
module.exports = ListBank;