const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const userSchema = new Schema({
    nama : {
        type : String,
        trim : true,
        required : true
    },
    email : {
        type : String,
        trim : true,
        required : false,
    },
    nik : {
        type : String,
        trim : true,
        required : false
    },
    userId : {
        type : String,
        required : true,
        trim : true,
        immutable: true ,
        index: { unique: true }
    },
    password : {
        type : String,
        required : true
    },
    dob : {
        type : Date
    },
    phone : {
        type : String,
        trim : true,
        required : false
    },
    handphone : {
        type : String,
        trim : true,
        required : false
    },
    address : {
        type : String,
        trim : true,
        required : false
    },
    province : {
        type: String,
        required : false
    },
    city : {
        type: String,
        required : false
    },
    district : {
        type: String,
        required : false
    },
    subdistrict : {
        type: String,
        required : false
    },
    zipcode : {
        type : String,
        trim : true,
        required : false
    },    
    address_complete : {
        type : String,
        trim : true
    },    
    policy_count :{
        type : Number
    },
    company: {
        type: Schema.Types.ObjectId,
        ref: "company"
    },
    gender : {
        type : String,
        trim : true
    }, 
    bank_acc_no : {
        type : String,
        trim : true
    }, 
    bank_name : {
        type : String,
        trim : true
    }, 
    bank_account_name : {
        type : String,
        trim : true
    }, 
    is_active : {
        type : Boolean,
        required : true,
        default :false
    },
    self_register : {
        type : Boolean,
        required : true,
        default :false
    },
    session : {
        type : String,
        trim : true
    }, 
    avatar : {
        type : String,
        trim : true
    },
    reset_token : {
        type : String,
        trim : true
    },    
    activation_date : {
        type : Date
    },
    updated_at : {
        type : Date
    },
    updated_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    },
    created_at : {
        type : Date
    },
    created_by: {
        type: Schema.Types.ObjectId,
        ref: "admin"
    }
},{skipVersioning: { dontVersionMe: true }})


userSchema.plugin(mongoosePaginate)
const User = mongoose.model("user", userSchema);
module.exports = User;