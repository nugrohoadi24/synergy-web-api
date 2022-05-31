const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');


const ImportUserSchema = new Schema({
    userId : {
        type : String
    },
    nama : {
        type : String
    },
    email : {
        type : String
    },
    nik : {
        type : String
    },
    password : {
        type : String
    },
    dob : {
        type : Date
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
    phone : {
        type : String
    },
    handphone : {
        type : String
    },
    company: {
        type : String
    },
    address: {
        type : String
    },
    province: {
        type : String
    },
    city: {
        type : String
    },
    district: {
        type : String
    },
    subdistrict: {
        type : String
    },
    zipcode: {
        type : String
    },
    status: {
        type : String
    },
    status_message: {
        type : String
    },
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } }) 

ImportUserSchema.plugin(mongoosePaginate)
const ImportUser = mongoose.model("import_user", ImportUserSchema);
module.exports = ImportUser;