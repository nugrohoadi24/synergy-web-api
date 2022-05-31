const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const ProductCategorySchema = new Schema({
    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true,
    },
    image : {
        type : String,
        required : true
    },
    is_active : {
        type : Boolean,
        required : true,
        default:false
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

ProductCategorySchema.plugin(mongoosePaginate)
const ProductCategory = mongoose.model("ProductCategory", ProductCategorySchema);
module.exports = ProductCategory;