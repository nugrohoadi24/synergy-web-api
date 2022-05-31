const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const CounterSchema = new Schema({  
    counter_name : {
        type : String,
        required : false,  
    },
    value : {
        type : Number,
        required : true,  
    },
    last_retrieve_date : {
        type : String,
        required : false,  
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })

const Counter = mongoose.model("counter", CounterSchema);
module.exports = Counter;