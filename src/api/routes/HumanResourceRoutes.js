const config = require('../config/config')
const router = require('express').Router()
const moment = require('moment')

const Company = require('../models/Company')
const HumanResource = require('../models/HumanResource')
const UserPolicy = require('../models/UserPolicy')
const CompanyPolicy = require('../models/CompanyPolicy')
const CompanyPolicyDeposit = require('../models/CompanyPolicyDeposit')
const UserClaim = require('../models/UserClaim')
const InsuranceProduct = require('../models/InsuranceProduct')
const Admin = require('../models/Admin')
const User = require('../models/User')
const Hospital = require('../models/Hospital')

const crypto = require("crypto")
const apiHelper = require('../helper/APIHelper')
const jwt = require('jsonwebtoken')

router.post("/auth", apiHelper.handleErrorAsync(async (req, res, next) => {
    const data = req.body

    if (apiHelper.isEmptyObj(data.email))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi email", undefined)

    if (apiHelper.isEmptyObj(data.password))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi password", undefined)

    var hr = await HumanResource.findOne({ "email": { $regex: new RegExp('^' + data.email.toUpperCase() + '$', "i") } }, 'name email is_active password company userId').exec();

    if (hr == null)
        return apiHelper.APIResponseBR(res, false, "User belum terdaftar!", null)

    var encPass = crypto.createHash("sha256").update(data.password).digest("hex")

    if (encPass == hr.password) {
        var finalres = {};

        var dataUser = {
            company: hr.company,
            id: hr._id,
            email: hr.email,
            name: hr.name,
            userId: "HR" + hr.userId
        };

        finalres.token = jwt.sign(dataUser, config.jwtpublic, { expiresIn: 86400 })

        return apiHelper.APIResponseOK(res, true, "Berhasil Login Sebagai HR Perusahaan", finalres)
    }
    return apiHelper.APIResponseBR(res, false, "Invalid user or password", null)
}))

router.post("/register_hr", apiHelper.authAccessOr({ MCOMPANY: config.action.Create }), apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body

    if (apiHelper.isEmptyObj(data.email))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi email HR", undefined)

    if (apiHelper.isEmptyObj(data.company))
        return apiHelper.APIResponseBR(res, false, "Silahkan pilih perusahaan", undefined)

    var verifyEmail = await HumanResource.findOne({ email: data.email.toUpperCase() }).count()
    if (verifyEmail > 0) {
        return apiHelper.APIResponseBR(res, false, "Email ini telah terdaftar.", undefined)
    }

    if (apiHelper.isEmptyObj(data.password))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi password", undefined)

    if (apiHelper.isEmptyObj(data.confirm_password))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi confirm password", undefined)

    if (data.password != data.confirm_password)
        return apiHelper.APIResponseBR(res, false, "Password dan confirm password tidak sesuai", undefined)

    if (apiHelper.isEmptyObj(data.name))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi nama HR", undefined)

    if (apiHelper.isEmptyObj(data.is_active))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi status akun ini", undefined)

    var encPw = crypto.createHash("sha256").update(data.password).digest("hex")

    var saveData = {
        email: data.email.toUpperCase(),
        company: data.company,
        password: encPw,
        name: data.name,
        is_active: data.is_active,
        created_at: moment().utc().toDate(),
        updated_at: moment().utc().toDate()
    }

    var result = await HumanResource.create(saveData);

    if (result) {
        return apiHelper.APIResponseOK(res, true, "Berhasil membuat akun baru untuk HR", undefined);
    } else {
        return apiHelper.APIResponseErr(res, false, "Gagal menambahkan akun baru untuk HR", undefined);
    }
}))

router.put("/update_hr/:id", apiHelper.authAccessOr({ MCOMPANY: config.action.Update }), apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body
    var id = req.params.id

    data.updated_at = moment().utc().toDate()

    if (apiHelper.isEmptyObj(data.password))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi password", undefined);

    if (apiHelper.isEmptyObj(data.confirm_password))
        return apiHelper.APIResponseBR(res, false, "Silahkan isi confirm password", undefined);

    if (data.password != data.confirm_password)
        return apiHelper.APIResponseBR(res, false, "Password dan confirm password tidak sesuai", undefined);

    var encPw = crypto.createHash("sha256").update(data.password).digest("hex")

    data.password = encPw

    var result = await HumanResource.findByIdAndUpdate({ _id: id }, data).exec();

    if (result) {
        return apiHelper.APIResponseOK(res, true, "Berhasil memperbarui data akun HR", undefined);
    } else {
        return apiHelper.APIResponseErr(res, false, "Gagal memperbarui akun HR", undefined);
    }
}))

router.delete("/delete/:id", apiHelper.authAccessOr({ MCOMPANY: config.action.Delete }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var result = await HumanResource.findByIdAndRemove(id).exec();
    if(result){
        return apiHelper.APIResponseOK(res, true, "Akun HR ini telah berhasil di hapus!", undefined);
    }else{
        return apiHelper.APIResponseBR(res, false, "Gagal Menghapus akun HR ini!", undefined);
    }
    
}))

router.get("/list_hr", apiHelper.authAccessOr({ MCOMPANY: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {

    const { page, perpage, searchquery, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ email: q });
    }

    var data = await HumanResource.paginate(finalQuery, {
        select:
            `
        _id
        company
        email 
        name
        is_active
        created_at
        updated_at`,
        populate: { path: 'company', select: '_id code name' },
        page: page,
        limit: parseInt(perpage),
        sort: `-updated_at`
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, "List HR Yang terdaftar.", data);
    });
}))

router.get("/detail/:id", apiHelper.authAccessOr({ MCOMPANY: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {

    var id = req.params.id
    var finalQuery = { _id: id }

    var data = await HumanResource.findOne(finalQuery).exec();

    data.company = await Company.findOne({ _id: data.company },
        `_id 
         name
         code
         is_active`).exec();

    if(data != undefined){
        return apiHelper.APIResponseOK(res, true, "Berhasil mendapatkan detail data HR.", data);
    }
    else{
        return apiHelper.APIResponseNF(res, false, "Data HR dengan akun ini tidak ditemukan", undefined);
    }
}))

router.get("/get_coverage", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {
    var statCompany = {}
    var statParticipant = {}
    var allStat = {}

    var co = await Company.findById({ _id: req.company }, `_id name`).exec()
    var coPolicy = await CompanyPolicy.find({ company: req.company }, `_id policy_no`).exec()

    statCompany.company_id = co._id
    statCompany.company_name = co.name

    allStat = {
        company_data: statCompany,
        company_coverage_data: coPolicy

    }

    return apiHelper.APIResponseOK(res, true, "Berhasil Mendapat data coverage", allStat);
}))

router.get("/get_coverage/stats/:id", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {
    var id = req.params.id
    var statCompany = {}
    var allStat = {}

    var co = await Company.findById({ _id: req.company }, `_id name`).exec()
    var coPolicy = await CompanyPolicy.findOne({ _id: id }, `_id policy_no policy_date policy_end_date`).exec()

    //Counting Participant
    var coParticipantTotal = await UserPolicy.find({ $and: [{ company_policy: coPolicy.policy_no }, { is_active: true }] }).count()
    var coParticipantMainEmployee = await UserPolicy.find({ $and: [{ company_policy: coPolicy.policy_no }, { relation: "KARYAWAN/UTAMA" }, { is_active: true }] }).count()
    var coParticipantSpouse = await UserPolicy.find({ $and: [{ company_policy: coPolicy.policy_no }, { relation: "PASANGAN" }, { is_active: true }] }).count()
    var coParticipantChild = await UserPolicy.find({ $and: [{ company_policy: coPolicy.policy_no }, { relation: "ANAK" }, { is_active: true }] }).count()

    //Counting Claim
    var coClaim = await UserClaim.find({ company_policy: coPolicy.policy_no }).count()
    var coCashless = await UserClaim.find({ $and: [{ company_policy: coPolicy.policy_no }, { cashless: true }] }).count()
    var coReimburse = await UserClaim.find({ $and: [{ company_policy: coPolicy.policy_no }, { cashless: false }] }).count()
    var coTotalClaimAmount = await UserClaim.aggregate([{
        $match: {
            $and: [
                { company_policy: coPolicy.policy_no }
            ]
        }
    },
    { $group: { _id: null, claim_total_amount: { $sum: "$claim_total_amount" } } }]).exec()
    var coApprovedClaimAmount = await UserClaim.aggregate([{
        $match: {
            $and: [
                { company_policy: coPolicy.policy_no }
            ]
        }
    },
    { $group: { _id: null, claim_approved_amount: { $sum: "$covered_total_amount" } } }]).exec()

    //Counting Deposit
    var coDeposit = await CompanyPolicyDeposit.aggregate([{
        $match: { company_policy: coPolicy._id }
    },
    { $group: { _id: null, total_deposit: { $sum: "$amount" } } }]).exec()

    var coDepositApprovedClaimAmount = await UserClaim.aggregate([{
        $match: {
            $and: [
                { company_policy: coPolicy.policy_no },
                { requester_product_type: "1" }
            ]
        }
    },
    { $group: { _id: null, approved_amount: { $sum: "$covered_total_amount" } } }]).exec()

    var depositApprovedAmount = 0
    if (coDepositApprovedClaimAmount.length != 0) {
        depositApprovedAmount = coDepositApprovedClaimAmount[0].approved_amount
    }

    //Counting Product
    var filter = {
        company_policy: coPolicy.policy_no,
    }

    var coProduct1 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "RAWAT INAP" } },
        {
            $facet: {
                docs: [
                    { $count: 'product1' }
                ]
            }
        }
    ]).exec()

    var coProduct2 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "PERAWATAN COVID-19" } },
        {
            $facet: {
                docs: [
                    { $count: 'product2' }
                ]
            }
        }
    ]).exec()

    var coProduct3 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "RAWAT JALAN KARYAWAN" } },
        {
            $facet: {
                docs: [
                    { $count: 'product3' }
                ]
            }
        }
    ]).exec()

    var coProduct4 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "RAWAT JALAN" } },
        {
            $facet: {
                docs: [
                    { $count: 'product4' }
                ]
            }
        }
    ]).exec()

    var coProduct5 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "RAWAT GIGI" } },
        {
            $facet: {
                docs: [
                    { $count: 'product5' }
                ]
            }
        }
    ]).exec()

    var coProduct6 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "PERSONAL ACCIDENT" } },
        {
            $facet: {
                docs: [
                    { $count: 'product6' }
                ]
            }
        }
    ]).exec()

    var coProduct7 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "MOVEABLE ALL RISK" } },
        {
            $facet: {
                docs: [
                    { $count: 'product7' }
                ]
            }
        }
    ]).exec()

    var coProduct8 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "KEHAMILAN & MELAHIRKAN" } },
        {
            $facet: {
                docs: [
                    { $count: 'product8' }
                ]
            }
        }
    ]).exec()

    var coProduct9 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "DANA BUFFER" } },
        {
            $facet: {
                docs: [
                    { $count: 'product9' }
                ]
            }
        }
    ]).exec()

    var coProduct10 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "RAWAT JALAN & GIGI" } },
        {
            $facet: {
                docs: [
                    { $count: 'product10' }
                ]
            }
        }
    ]).exec()

    var coProduct11 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "HOSPITAL CASH PLAN" } },
        {
            $facet: {
                docs: [
                    { $count: 'product11' }
                ]
            }
        }
    ]).exec()

    var coProduct12 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "LOSS OF INCOME" } },
        {
            $facet: {
                docs: [
                    { $count: 'product12' }
                ]
            }
        }
    ]).exec()

    var coProduct13 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "SANTUNAN TUNAI" } },
        {
            $facet: {
                docs: [
                    { $count: 'product13' }
                ]
            }
        }
    ]).exec()

    var coProduct12 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "LOSS OF INCOME" } },
        {
            $facet: {
                docs: [
                    { $count: 'product12' }
                ]
            }
        }
    ]).exec()

    var coProduct14 = await UserClaim.aggregate([
        {
            $match: filter
        },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "policy",
                foreignField: "_id",
                as: "policy_data"
            }
        },
        {
            $unwind: {
                "path": "$policy_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "insurance_product",
                localField: "policy_data.insurance_product",
                foreignField: "_id",
                as: "product_data"
            }
        },
        { $match: { "product_data.type": "KECELAKAAN DIRI" } },
        {
            $facet: {
                docs: [
                    { $count: 'product14' }
                ]
            }
        }
    ]).exec()


    //Result
    statCompany.company_id = co._id
    statCompany.company_name = co.name

    var coCoverageData = {
        coverage_id: coPolicy._id,
        coverage_number: coPolicy.policy_no,
        coverage_period: `${moment(coPolicy.policy_date).format('D MMM YYYY')} - ${moment(coPolicy.policy_end_date).format('D MMM YYYY')}`,
        coverage_expired_in: `${moment(coPolicy.policy_end_date).diff(moment().locale("ID"), 'days')} DAYS`
    }

    var coParticipant = {
        participant_total: coParticipantTotal,
        participant_total_employee_main: coParticipantMainEmployee,
        participant_total_spouse: coParticipantSpouse,
        participant_total_child: coParticipantChild
    }

    var coClaimData = {
        claim_cases: coClaim,
        claim_total_ammount: coTotalClaimAmount[0].claim_total_amount,
        claim_approved_amount: coApprovedClaimAmount[0].claim_approved_amount,
        claim_approved_percentage: (coApprovedClaimAmount[0].claim_approved_amount / coTotalClaimAmount[0].claim_total_amount) * 100
    }

    var mainDeposit = (depositApprovedAmount / coDeposit[0].total_deposit) * 100
    if (depositApprovedAmount == 0) {
        mainDeposit = 100
    }
    var coDepositData = {
        deposit_amount: coDeposit[0].total_deposit,
        deposit_remaining: coDeposit[0].total_deposit - depositApprovedAmount,
        deposit_remaining_percentage: mainDeposit
    }

    //Default as 0
    var totalProduct1 = 0
    var totalProduct2 = 0
    var totalProduct3 = 0
    var totalProduct4 = 0
    var totalProduct5 = 0
    var totalProduct6 = 0
    var totalProduct7 = 0
    var totalProduct8 = 0
    var totalProduct9 = 0
    var totalProduct10 = 0
    var totalProduct11 = 0
    var totalProduct12 = 0
    var totalProduct13 = 0
    var totalProduct14 = 0

    //Validating
    if (coProduct1[0].docs.length != 0) {
        totalProduct1 = coProduct1[0].docs[0].product1
    }
    if (coProduct2[0].docs.length != 0) {
        totalProduct2 = coProduct2[0].docs[0].product2
    }
    if (coProduct3[0].docs.length != 0) {
        totalProduct3 = coProduct3[0].docs[0].product3
    }
    if (coProduct4[0].docs.length != 0) {
        totalProduct4 = coProduct4[0].docs[0].product4
    }
    if (coProduct5[0].docs.length != 0) {
        totalProduct5 = coProduct5[0].docs[0].product5
    }
    if (coProduct6[0].docs.length != 0) {
        totalProduct6 = coProduct6[0].docs[0].product6
    }
    if (coProduct7[0].docs.length != 0) {
        totalProduct7 = coProduct7[0].docs[0].product7
    }
    if (coProduct8[0].docs.length != 0) {
        totalProduct8 = coProduct8[0].docs[0].product8
    }
    if (coProduct9[0].docs.length != 0) {
        totalProduct9 = coProduct9[0].docs[0].product9
    }
    if (coProduct10[0].docs.length != 0) {
        totalProduct10 = coProduct10[0].docs[0].product10
    }
    if (coProduct11[0].docs.length != 0) {
        totalProduct11 = coProduct11[0].docs[0].product11
    }
    if (coProduct12[0].docs.length != 0) {
        totalProduct12 = coProduct12[0].docs[0].product12
    }
    if (coProduct13[0].docs.length != 0) {
        totalProduct13 = coProduct13[0].docs[0].product13
    }
    if (coProduct14[0].docs.length != 0) {
        totalProduct14 = coProduct14[0].docs[0].product14
    }

    var coProduct = [
        {
            product_type: "RAWAT INAP",
            product_total_claim: totalProduct1
        },
        {
            product_type: "PERAWATAN COVID-19",
            product_total_claim: totalProduct2
        },
        {
            product_type: "RAWAT JALAN KARYAWAN",
            product_total_claim: totalProduct3
        },
        {
            product_type: "RAWAT JALAN",
            product_total_claim: totalProduct4
        },
        {
            product_type: "RAWAT GIGI",
            product_total_claim: totalProduct5
        },
        {
            product_type: "PERSONAL ACCIDENT",
            product_total_claim: totalProduct6
        },
        {
            product_type: "MOVEABLE ALL RISK",
            product_total_claim: totalProduct3
        },
        {
            product_type: "KEHAMILAN & MELAHIRKAN",
            product_total_claim: totalProduct8
        },
        {
            product_type: "DANA BUFFER",
            product_total_claim: totalProduct9
        },
        {
            product_type: "RAWAT JALAN & GIGI",
            product_total_claim: totalProduct10
        },
        {
            product_type: "HOSPITAL CASH PLAN",
            product_total_claim: totalProduct11
        },
        {
            product_type: "LOSS OF INCOME",
            product_total_claim: totalProduct12
        },
        {
            product_type: "SANTUNAN TUNAI",
            product_total_claim: totalProduct13
        },
        {
            product_type: "KECELAKAAN DIRI",
            product_total_claim: totalProduct14
        }
    ]

    allStat = {
        company_data: statCompany,
        coverage_data: coCoverageData,
        coverage_participant_data: coParticipant,
        coverage_claim_data: coClaimData,
        coverage_recap_claim_data: [
            {
                claim_name: "CASHLESS",
                claim_total: coCashless,
                claim_percentage: (coCashless / coClaim) * 100
            },
            {
                claim_name: "REIMBURSE",
                claim_total: coReimburse,
                claim_percentage: (coReimburse / coClaim) * 100
            }
        ],
        coverage_deposit: coDepositData,
        coverage_product: coProduct
    }

    return apiHelper.APIResponseOK(res, true, "Berhasil Mendapat statistik data coverage", allStat);
}))

router.get("/list_participant/:policy_id", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.policy_id
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {}
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ certificate_no: q });
        finalQuery["$or"].push({ company_policy: q });
        finalQuery["$or"].push({ card_no: q });
        finalQuery["$or"].push({ nama_tertanggung: q });
        finalQuery["$or"].push({ nik_tertanggung: q });
        finalQuery["$or"].push({ "user.nama": q });

        var vdate = ""
        try {
            vdate = moment.utc(searchquery, "DD/MM/YYYY").toDate()
            if (apiHelper.isValidDate(vdate))
                finalQuery["$or"].push({ dob_tertanggung: vdate });
        } catch (e) {

        }
    }

    var coPolicy = await CompanyPolicy.findOne({ _id: id }, `_id policy_no policy_date policy_end_date`).exec()

    var result = await UserPolicy.aggregate([
        {
            $match: {
                company_policy: coPolicy.policy_no,
            }
        },
        {
            $lookup: {
                from: "user",
                localField: "user",
                foreignField: "_id",
                as: "user"
            }
        },
        { $unwind: "$user" },
        { $match: finalQuery },
        {
            $lookup: {
                from: "insurance_product",
                localField: "insurance_product",
                foreignField: "_id",
                as: "insurance_product"
            }
        },
        { $unwind: "$insurance_product" },
        {
            $project: {
                'is_active': 1, 'certificate_no': 1, 'nama_tertanggung': 1, 'policy_date': 1, 'policy_end_date': 1, 'dob_tertanggung': 1,
                'plan_name': 1, 'card_no': 1, 'created_at': 1, 'updated_at': 1, 'company_policy': 1,
                'user._id': 1, 'user.nama': 1, 'user.email': 1,
                'insurance_product._id': 1, 'insurance_product.code': 1, 'insurance_product.name': 1, 'insurance_product.product_type': 1,
            }
        },
        {
            $facet: {
                docs: [{ $skip: (parseInt(page) - 1) * parseInt(perpage) }, { $limit: parseInt(perpage) }],
                totalCount: [{
                    $count: 'count'
                }]
            }
        }
    ]).exec();

    if (result != null && result.length > 0) {
        var totalCount = 0;

        for (var key in result[0].docs) {
            var tempData = result[0].docs[key];
            var dt1 = moment(tempData.policy_date).startOf('day');
            var dt2 = moment(tempData.policy_end_date).startOf('day');
            var currentDt = moment().startOf('day');

            if (tempData.is_active) {
                if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
                    tempData.status_polis = "EXPIRED";
                } else {
                    tempData.status_polis = "ACTIVE";
                }
            } else {
                tempData.status_polis = "NON-ACTIVE";
            }
        }

        if (Boolean(result[0].totalCount) && result[0].totalCount.length > 0)
            totalCount = result[0].totalCount[0].count;

        return apiHelper.APIResponseOK(res, true, "Berhasil mendapatkan list data participant", {
            docs: result[0].docs,
            page: page,
            pages: Math.ceil(totalCount / perpage),
            total: totalCount,
            limit: perpage
        });
    } else {
        return apiHelper.APIResponseErr(res, false, undefined, undefined);
    }
}))

router.get("/list_participant/detail/:id", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {

    const id = req.params.id;

    var finalQuery = { _id: id }
    var policyData = await UserPolicy.findOne(finalQuery).lean().exec();

    if (apiHelper.isEmptyObj(policyData))
        return apiHelper.APIResponseNF(res, false, "Data tidak di temukan", undefined)

    var resultUser = await User.findOne({ _id: policyData.user }, '_id nama company email handphone').lean().exec()
    var resultProduct = await InsuranceProduct.findOne({ _id: policyData.insurance_product }, '_id code name').lean().exec()


    resultUser.userDesc = resultUser.nama;
    if (Boolean(resultUser.email)) {
        resultUser.userDesc += " / " + resultUser.email
    }

    if (Boolean(resultUser.handphone))
        resultUser.userDesc += " / " + resultUser.handphone


    if (Boolean(policyData.updated_by))
        policyData.updated_by = await Admin.findByIdAndUpdate({ _id: policyData.updated_by }, "_id name").exec()

    if (Boolean(policyData.created_by))
        policyData.created_by = await Admin.findByIdAndUpdate({ _id: policyData.created_by }, "_id name").exec()

    var dt1 = moment(policyData.policy_date).startOf('day')
    var dt2 = moment(policyData.policy_end_date).startOf('day')
    var currentDt = moment().startOf('day')

    if (policyData.is_active) {
        if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
            policyData.status_polis = "EXPIRED"
        } else {
            policyData.status_polis = "ACTIVE"
        }
    } else {
        policyData.status_polis = "NON-ACTIVE"
    }

    policyData.user = resultUser;
    policyData.insurance_product = resultProduct;

    return apiHelper.APIResponseOK(res, true, "Berhasil mendapatkan detail data peserta", policyData)
}))

router.get("/detail_contract", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {

    var finalQuery = { _id: req.company }

    var data = await Company.findOne(finalQuery).exec()

    if (apiHelper.isEmptyObj(data))
        return apiHelper.APIResponseNF(res, false, "Data Perusahaan tidak ditemukan", undefined)

    return apiHelper.APIResponseOK(res, true, undefined, data)

}))

router.get("/list_provider/:type", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = {}
    const { page, perpage, search } = req.query;

    console.log(req.params.type)

    if (req.params.type == "ALL") {
        finalQuery = { is_active: true }
    } else {
        finalQuery = { is_active: true, type: req.params.type }
    }

    if (search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ address_complete: q });
    }

    var result = Hospital.paginate(finalQuery, {
        select: "code name address address_complete phone1 longitude latitude zipcode type",
        page: page,
        limit: parseInt(perpage),
        sort: "-updated_at"
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, "Berhasil mendapatkan data list provider", data);
    });
}))

router.get("/deposit/:policy_id", apiHelper.authAccessHR(), apiHelper.handleErrorAsync(async (req, res, next) => {

    var id = req.params.policy_id

    var co = await Company.findById({ _id: req.company }, `_id name`).exec()
    var coPolicy = await CompanyPolicy.findOne({ _id: id }, `_id is_active is_used policy_no policy_date policy_end_date note created_at updated_at`).exec()

    if (coPolicy != undefined) {
        var coDeposit = await CompanyPolicyDeposit.find({ company_policy: coPolicy._id }, `_id amount transaction_date note created_at updated_at`).exec()
        if (coDeposit != undefined) {
            var coDepositTotal = await CompanyPolicyDeposit.aggregate([{
                $match: { company_policy: coPolicy._id }
            },
            { $group: { _id: null, total_deposit: { $sum: "$amount" } } }]).exec()

            var coDepositApprovedClaimAmount = await UserClaim.aggregate([{
                $match: {
                    $and: [
                        { company_policy: coPolicy.policy_no },
                        { requester_product_type: "1" }
                    ]
                }
            },
            { $group: { _id: null, approved_amount: { $sum: "$covered_total_amount" } } }]).exec()

            var depositApprovedAmount = 0
            if (coDepositApprovedClaimAmount.length != 0) {
                depositApprovedAmount = coDepositApprovedClaimAmount[0].approved_amount
            }

            var mainDeposit = (depositApprovedAmount / coDepositTotal[0].total_deposit) * 100
            if (depositApprovedAmount == 0) {
                mainDeposit = 100
            }

            var data = {
                docs: coDeposit,
                policy_data: coPolicy,
                deposit_total_amount: coDepositTotal[0].total_deposit,
                deposit_remaining: coDepositTotal[0].total_deposit - depositApprovedAmount,
                deposit_remaining_percentage: mainDeposit,
                total: 1,
                limit: 1,
                page: "1",
                pages: 1

            }

            return apiHelper.APIResponseOK(res, true, "Berhasil mendapatkan data deposit", data);
        }
        return apiHelper.APIResponseBR(res, false, "Tidak ditemukan data deposit dengan nomor polis ini", data);
    }

    return apiHelper.APIResponseBR(res, false, "Tidak ditemukan data polis dengan nomor ini", data);

}))

module.exports = router;