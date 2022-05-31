const config = require('../config/config');
const router = require('express').Router();
const moment = require('moment');

const DigitalForm = require('../models/DigitalForm');
const User = require('../models/User');
const Company = require('../models/Company');
const Hospital = require('../models/Hospital');
const Policy = require('../models/UserPolicy');
const History = require('../models/History');
const Claim = require('../models/UserClaim');
const InsuranceProduct = require('../models/InsuranceProduct');
const Counter = require('../models/Counter');

const apiHelper = require('../helper/APIHelper');
const strHelper = require('../helper/StringHelper');

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

var ObjectID = require('mongodb').ObjectID;

router.get("/", apiHelper.authAccessOr({ DIGITALFORM: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ "form_participant_name": q });
        finalQuery["$or"].push({ "form_participant_user_id": q });
        finalQuery["$or"].push({ "form_participant_phone_number": q });
        finalQuery["$or"].push({ "form_identity_card_no": q });
    }

    var sort = { 'created_at': -1 };

    var result = await DigitalForm.aggregate([
        { $match: finalQuery },
        {
            $lookup: {
                from: "UserPolicy",
                localField: "form_certificate_no",
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
            $project: {
                '_id': 1,
                'form_type': 1,
                'form_submit_no': 1,
                'form_claim_no': 1,
                'form_status': 1,
                'form_user_submit': 1,
                'form_participant_name': 1,
                'form_participant_phone_number': 1,
                'form_participant_email': 1,
                'form_identity_card_no': 1,
                'form_participant_user_id': 1,
                'form_participant_hospital': 1,
                'form_reason_submit': 1,
                'form_repoter': 1,
                'form_submit_signature': 1,
                'created_at': 1,
                'updated_at': 1,
                'policy_data.certificate_no': 1,
                'policy_data.card_no': 1,
                'policy_data.product_type': 1
            }
        },
        {
            $sort: sort
        },
        {
            $facet: {
                docs: [
                    { $skip: (parseInt(page) - 1) * parseInt(perpage) },
                    { $limit: parseInt(perpage) }
                ],
                totalCount: [{
                    $count: 'count'
                }]
            }
        }
    ]).exec();

    if (result != null && result.length > 0) {
        var totalCount = 0;
        if (Boolean(result[0].totalCount) && result[0].totalCount.length > 0)
            totalCount = result[0].totalCount[0].count;
        return apiHelper.APIResponseOK(res, true, "Berhasil Mendapatkan Data",
            {
                docs: result[0].docs,
                page: page,
                pages: Math.ceil(totalCount / perpage),
                total: totalCount,
                limit: parseInt(perpage)
            });
    } else {
        return apiHelper.APIResponseBR(res, false, "Gagal Mendapatkan Data", undefined);
    }
}))

router.get("/detail/:id", apiHelper.authAccessOr({ DIGITALFORM: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = { _id: id }

    var data = await DigitalForm.findOne(finalQuery).exec();
    if (apiHelper.isEmptyObj(data))
        return apiHelper.APIResponseNF(res, false, "Data tidak ditemukan", undefined);

    data.form_user_submit = await User.findOne({ _id: data.form_user_submit },
        `_id 
        nama`).exec();

    data.form_company_affliation = await Company.findOne({ _id: data.form_company_affliation },
        `_id 
         name
         code
         is_active`).exec();

    data.form_certificate_no = await Policy.findOne({ _id: data.form_certificate_no },
        `_id 
        certificate_no
        desc
        nama_tertanggung
        nik_tertanggung
        dob_tertanggung
        product_type`).exec();

    data.form_participant_hospital = await Hospital.findOne({ _id: data.form_participant_hospital },
        `_id 
        name
        code
        admin_email
        type
        is_active`).exec();

    return apiHelper.APIResponseOK(res, true, undefined, data);
}))

router.put("/reject/:id", apiHelper.authAccessOr({ DIGITALFORM: config.action.Update }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = { _id: id }

    var data = await DigitalForm.findOne(finalQuery).exec();
    if (apiHelper.isEmptyObj(data))
        return apiHelper.APIResponseNF(res, false, "Data tidak ditemukan", undefined);
    if (data.form_status != config.status_form.PENDING) {
        return apiHelper.APIResponseBR(res, false, "Status Form Saat ini bukan pending review, Gagal memperbarui.", undefined);
    }

    var result = await DigitalForm.findByIdAndUpdate(finalQuery, { form_status: config.status_form.REJECTED }).exec();
    if (result) {
        return apiHelper.APIResponseOK(res, true, "Berhasil Mengubah status form Saat ini", undefined);
    } else {
        return apiHelper, APIResponseErr(res, false, "Terjadi Kesalahan, Silahkan coba kembali.", undefined)
    }

}))

router.post("/proccess", apiHelper.authAccessOr({ DIGITALFORM: config.action.Create }), apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    if (apiHelper.isEmptyObj(data.form_id))
        errmsg += "* Silahkan input id form \r\n";

    if (apiHelper.isEmptyObj(data.policy_id))
        errmsg += "* Silahkan input id sertifikat (Policy) \r\n";

    if (apiHelper.isEmptyObj(data.hospital))
        errmsg += "* Silahkan input rumah sakit yg akan di claim \r\n";

    if (apiHelper.isEmptyObj(data.requester_name))
        errmsg += "* Silahkan input Nama Pengaju Claim yg akan di claim \r\n";

    if (apiHelper.isEmptyObj(data.requester_nik))
        errmsg += "* Silahkan input NIK Pengaju Claim yg akan di claim \r\n";

    if (apiHelper.isEmptyObj(data.requester_phone))
        errmsg += "* Silahkan input Phone/WA Pengaju Claim yg akan di claim \r\n";

    var form = await DigitalForm.findById({ _id: data.form_id }).exec();

    if (form.form_status == "PROCESSED")
        errmsg += "* Form Ini Telah Di Proses dan di masukan ke daftar transaksi claim, silahkan proses klaim yang berbeda."

    if (apiHelper.isEmptyObj(errmsg)) {
        var saveData = {};

        saveData.created_by = req.user;
        saveData.hospital = data.hospital;

        switch (form.form_type) {
            case "CASHLESS":
                saveData.cashless = true;
                break;
            case "REIMBURSE":
                saveData.cashless = false;
        }

        saveData.claim_status = "CREATED";

        saveData.request_claim_date = moment.utc();
        saveData.accident_description = data.accident_description;
        saveData.claim_reason = data.claim_reason;
        saveData.requester_name = data.requester_name;
        saveData.requester_phone = data.requester_phone;
        saveData.requester_email = data.requester_email;
        saveData.requester_relation = data.requester_relation;
        saveData.requester_nik = data.requester_nik;
        saveData.request_claim_note = data.request_claim_note;
        saveData.requester_product_type = data.requester_product_type;
        saveData.nama_tertanggung = data.nama_tertanggung;
        switch (data.claim_reason) {
            case "SAKIT":
                saveData.incident_date = form.form_reason_sick_detail[0].sick_recognized_at;
                break;
            case "KECELAKAAN":
                saveData.incident_date = form.form_reason_incident_detail[0].incident_date;
                saveData.incident_body_part_injured = form.form_reason_incident_detail[0].incident_body_part_injured;
                break;
        }

        var policy = await Policy.findById({ _id: data.policy_id });
        saveData.policy = data.policy_id

        //validasi claim double
        var existingData = await Claim.count({
            policy: data.policy_id,
            user: policy.user,
            claim_status: {
                $in: [
                    config.claim_status.CREATED,
                    config.claim_status.PROCESSED,
                    config.claim_status.SJM_CREATED,
                    config.claim_status.SJM_SENT,
                    config.claim_status.CLAIM_DETAIL
                ]
            }
        }).exec();

        if (existingData > 0) {
            return apiHelper.APIResponseBR(res, false, "Silahkan selesaikan claim yg sebelumnya, masih terdapat claim yg belum melewati status 'Processed", undefined);
        }

        //validasi nomor claim double
        var existingData = await Claim.count({
            policy: data.policy_id,
        }).exec();

        if (!Boolean(policy))
            return apiHelper.APIResponseNF(res, false, "data polis  tidak di temukan, silahkan cek kembali data anda\r\n", undefined);

        saveData.user = await User.findOne({ _id: policy.user });
        if (!Boolean(policy))
            return apiHelper.APIResponseNF(res, false, "User tidak di temukan, silahkan cek kembali data anda\r\n", undefined);

        saveData.product_id = policy.insurance_product;
        var insuranceProduct = await InsuranceProduct.findOne({ _id: saveData.product_id });

        if (!Boolean(insuranceProduct))
            return apiHelper.APIResponseNF(res, false, "Silahkan cek kembali data polis anda, product tidak di temukan", undefined);

        saveData.user_id = saveData.user.userId;
        saveData.user_name = saveData.user.nama;
        saveData.card_no = policy.card_no;


        saveData.claim_total_amount = 0;
        saveData.covered_total_amount = 0;
        saveData.excess_total_amount = 0;

        saveData.company_policy = policy.company_policy;
        saveData.insurance_product_name = insuranceProduct.name;
        saveData.insurance_product_type = insuranceProduct.type;
        saveData.insurance_product_plan_name = policy.plan_name;
        saveData.insurance_product_reject_note = "-";

        saveData.claim_no = form.form_claim_no;

        saveData.created_at = moment().utc().toDate();
        saveData.created_by = req.user;
        saveData.document = form.form_attachement

        var result = await Claim.create(saveData);

        await History.create({
            title: "KLAIM NO " + saveData.claim_no + ": " + config.claim_status_text.CREATED,
            description: "KLAIM NO " + saveData.claim_no + ": " + config.claim_status_text.CREATED,
            type: "CLAIM",
            user: saveData.user,
            created_at: moment().utc().toDate(),
            created_by: req.user
        });

        policy.is_used = true;

        await policy.save();

        form.form_status = config.status_form.PROCESSED

        await form.save();

        return apiHelper.APIResponseOK(res, true, "Berhasil Memproses klaim saat ini.", undefined);
    } else {
        return apiHelper.APIResponseErr(res, false, errmsg, undefined);
    }
}))

router.post("/upload_docs/:id", apiHelper.authAccessOr({ DIGITALFORM: config.action.Create | config.action.Update }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query

    var id = req.params.id
    var type = req.headers.type
    var docType = ""

    switch (type) {
        case "KTP":
            docType = "KTP";
            break;
        case "RESUME_MEDIS":
            docType = "RESUME_MEDIS";
            break;
        case "RECEIPT_BIAYA_PENGOBATAN":
            docType = "LAST_RECEIPT";
            break;
        case "RECEIPT_BIAYA_PENUNJANG_MEDIS":
            docType = "COPY_RESEP";
            break;
        case "OTHERS":
            docType = "OTHERS";
            break;
    }

    var form = await DigitalForm.findOne({ _id: id }).exec();
    if (apiHelper.isEmptyObj(form))
        return apiHelper.APIResponseNF(res, false, "Form dengan id ini tidak ditemukan", undefined);

    const user = form.form_user_submit

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp' || ext == '.jfif')) {
            return apiHelper.APIResponseErr(res, false, "File yg dapat di upload hanya jpg, jpeg, png dan bmp", null);
        }

        var fileAbsPath = `/digital_form_document/${user._id}/`;
        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }

        var fileName = `${docType}_` + user._id + strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        fstream.on('close', function () {
            var newImage = {
                _id: mongoose.Types.ObjectId(),
                name: filename,
                mimetype: mimetype,
                path: fileAbsPath + fileName,
                type: docType
            }
            form.form_attachement.push(newImage);

            form.save(function (err, model) {
                return apiHelper.APIResponseOK(res, true, "Berhasil Upload Document", {
                    document_id: newImage._id
                });
            });
        });
    });

}))

router.post("/remove_docs/:id/:docs_id", apiHelper.authAccessOr({ DIGITALFORM: config.action.Create | config.action.Update }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query
    const docType = req.headers.type
    const user = req.user

    var id = req.params.id
    var docsId = req.params.docs_id

    var form = await DigitalForm.findById({ _id: id }).exec();
    if (apiHelper.isEmptyObj(form))
        return apiHelper.APIResponseNF(res, false, "Form dengan id ini tidak ditemukan", undefined);

    for (var index = 0; index < form.form_attachement.length; index++) {
        var doc = form.form_attachement[index];
        if (doc._id.toString() == docsId) {
            form.form_attachement.splice(index, 1);
            var fileAbsPath = config.uploadTempPath + doc.path;
            try {
                fs.unlinkSync(fileAbsPath);
            } catch (e) {
            }
            await form.save();
        }
    }

    return apiHelper.APIResponseOK(res, true, "Berhasil menghapus document.", undefined);

}))
module.exports = router;