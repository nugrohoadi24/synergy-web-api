const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mongoosePaginate = require('mongoose-paginate');

const MembershipSchema = new Schema({

    membership_status: {
        type: String,
        require: true,
        default: "WAITING_PAYMENT"
    },
    membership_id : {
        type: String,
        require: true
    },
    member_nik : {
        type: String,
        require: false
    },
    member_name : {
        type: String,
        require: false
    },
    member_birthdate : {
        type: Date,
        required: true
    },
    member_birthplace : {
        type: String,
        required: false
    },
    member_email : {
        type: String,
        required: false
    },
    member_address : {
        type: String,
        required: false
    },
    member_benefit_receiver_name : {
        type: String,
        required: false
    },
    member_transaction_id : {
        type: Schema.Types.ObjectId,
        ref: "OrderTransaction",
        required: false
    },
    member_created_at : {
        type: Date
    },
    member_updated_at : {
        type: Date
    }

}, {skipVersioning: { dontVersionMe: true }})

MembershipSchema.plugin(mongoosePaginate)
const Membership = mongoose.model("Membership", MembershipSchema);
module.exports = Membership;