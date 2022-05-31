const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const FaqSchema = new Schema({
    question : {
        type : String,
        required : true
    },
    answer : {
        type : String,
        required : true
    },
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })

FaqSchema.plugin(mongoosePaginate)
const Faq = mongoose.model("faq", FaqSchema);
module.exports = Faq;