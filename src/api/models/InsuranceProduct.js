const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const benefit_limit_schema = new Schema({
    plan_name : {
        type : String,
        required : true,
    },
    unit_price_limit : {
        type : Number,
        required : true,
    },    
    limit1 : {
        type : Number,
        required : true,
    },
    limit1Type : {
        type : String,
        required : true,
    },
    limit2: {
        type : Number,
        required : false,
    },
    limit2Type : {
        type : String,
        required : false,
    },
     
 },{skipVersioning: { dontVersionMe: true }})
 
 const benefit_year_limit_schema = new Schema({
    plan_name : {
        type : String,
        required : true,
    },
    limit : {
        type : Number,
        required : true,
    }
 },{skipVersioning: { dontVersionMe: true }})

const benefit_schema = new Schema({
    name : {
        type : String,
        required : true
    },    
    benefit_note : {
        type : String
    },
    unit : {
        type : String,
        required : true,
    },
    is_group : {
        type : Boolean,
        required : false
    },
    unit_name : {
        type : String,
        required : true,
    },
    plan : [benefit_limit_schema]
},{skipVersioning: { dontVersionMe: true }})


const insurance_product_schema = new Schema({
    code : {
        type : String,
        required : true
    },
    name : {
        type : String,
        required : true
    },
    type : {
        type : String,
        required : true
    },
    benefit :[benefit_schema],
    benefit_year_limit :[benefit_year_limit_schema],
    excess_dijamin :{
        type : Boolean,
        required : true,
        default: false
    },
    is_active : {
        type : Boolean,
        required : true,
        default:false
    },
    product_type : {
        type : String,
        required : true
    }
},{skipVersioning: { dontVersionMe: true },timestamps: { createdAt: 'created_at',updatedAt:"updated_at" } })


insurance_product_schema.plugin(mongoosePaginate)
const InsuranceProduct = mongoose.model("insurance_product", insurance_product_schema);
const Benefit = mongoose.model("benefit", benefit_schema);
module.exports = Benefit;
module.exports = InsuranceProduct;