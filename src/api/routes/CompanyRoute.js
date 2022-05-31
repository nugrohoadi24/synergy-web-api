const config = require('../config/config');
const router = require('express').Router();
const Company = require('../models/Company');
const apihelper = require('../helper/APIHelper');
const strHelper = require('../helper/StringHelper');
const moment = require('moment');

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

router.get("/", apihelper.authAccessOr({ MCOMPANY: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {}
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = { name: q };
    }

    var result = Company.paginate(finalQuery, {
        select: "_id code name is_active created_at updated_at",
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });

}))

router.get("/detail/:id", apihelper.authAccessOr({ MCOMPANY: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {

    const id = req.params.id;

    var finalQuery = { _id: id }

    var data = await Company.findOne(finalQuery).exec();
    if (apihelper.isEmptyObj(data))
        return apihelper.APIResponseNF(res, false, "Data Perusahaan tidak ditemukan", undefined);

    return apihelper.APIResponseOK(res, true, undefined, data);

}))

router.get("/selection/", apihelper.authAccessOr({
    MCOMPANY: config.action.View,
    MCOMPPOLICY: config.action.View | config.action.Create | config.action.Update,
    MUSER: config.action.View | config.action.Create | config.action.Update,
    RCLAIMRATIO: config.action.View | config.action.Create | config.action.Update,
    RCLAIMDETAIL: config.action.View | config.action.Create | config.action.Update,
    RTOPTEN: config.action.View | config.action.Create | config.action.Update
}), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery } = req.query;

    var finalQuery = {}
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = { name: q };
    }

    var result = Company.paginate(finalQuery, {
        select: "_id code name",
        page: page,
        limit: parseInt(perpage)
    }).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.code))
        return apihelper.APIResponseBR(res, false, "Silahkan isi code Client", undefined);

    if (apihelper.isEmptyObj(data.name))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nama Client", undefined);

    if (apihelper.isEmptyObj(data.company_npwp))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nomor NPWP", undefined);

    if (apihelper.isEmptyObj(data.company_akta))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nomor akta", undefined);

    if (apihelper.isEmptyObj(data.company_sop_nib))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nomor sop/nib", undefined);

    if (apihelper.isEmptyObj(data.company_ktp))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nomor ktp penanggung jawab", undefined);

    if (apihelper.isEmptyObj(data.company_bank_acc_no))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nomor rekening perusahaan", undefined);

    if (data._id) {
        var result = await Company.findByIdAndUpdate({ _id: data._id }, data, {
            upsert: true
        }).exec();

        return apihelper.APIResponseOK(res, true, "Berhasil memperbarui data perusahaan", undefined);

    } else {
        var result = await Company.create(data);

        return apihelper.APIResponseOK(res, true, "Berhasil membuat data perusahaan baru", undefined);
    }


})

router.put("/", apihelper.authAccessOr({ MCOMPANY: config.action.Create }), dataFunc)

router.post("/", apihelper.authAccessOr({ MCOMPANY: config.action.Update }), dataFunc)

router.delete("/:id", apihelper.authAccessOr({ MCOMPANY: config.action.Delete }), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Company.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true, "", undefined);
}))

router.post("/upload_docs/:id", apihelper.authAccessOr({ MCOMPANY: config.action.Create | config.action.Update }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query
    

    var id = req.params.id
    var type = req.headers.type
    var docType = ""

    switch (type) {
        case "NPWP":
            docType = "NPWP";
            break;
        case "AKTA":
            docType = "AKTA";
            break;
        case "SOP_NIB":
            docType = "SOP_NIB";
            break;
        case "KTP":
            docType = "KTP";
            break;
    }

    var company = await Company.findOne({ _id: id }).exec();
    if (apihelper.isEmptyObj(company))
        return apihelper.APIResponseNF(res, false, "Perusahaan dengan id ini tidak ditemukan", undefined);

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.pdf')) {
            return apihelper.APIResponseErr(res, false, "File yg dapat di upload hanya berupa extensi .pdf", null);
        }

        var fileAbsPath = `/company_document/${company._id}/`;
        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }

        var fileName = `${docType}_` + company._id + strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        fstream.on('close', function () {
            var stats = fs.statSync(config.uploadTempPath + fileAbsPath + fileName);
            var newImage = {
                _id: mongoose.Types.ObjectId(),
                name: filename,
                mimetype: mimetype,
                path: fileAbsPath + fileName,
                type: docType,
                size:stats.size 
            }
            company.company_attachement.push(newImage);

            company.save(function (err, model) {
                return apihelper.APIResponseOK(res, true, "Berhasil Upload Document", {
                    document_id: newImage._id
                });
            });
        });
    });

}))

router.post("/remove_docs/:id/:docs_id", apihelper.authAccessOr({ MCOMPANY: config.action.Create | config.action.Update }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query
    const docType = req.headers.type
    const user = req.user

    var id = req.params.id
    var docsId = req.params.docs_id

    var company = await Company.findById({ _id: id }).exec();
    if (apihelper.isEmptyObj(company))
        return apihelper.APIResponseNF(res, false, "Perusahaan dengan id ini tidak ditemukan", undefined);

    for (var index = 0; index < company.company_attachement.length; index++) {
        var doc = company.company_attachement[index];
        if (doc._id.toString() == docsId) {
            company.company_attachement.splice(index, 1);
            var fileAbsPath = config.uploadTempPath + doc.path;
            try {
                fs.unlinkSync(fileAbsPath);
            } catch (e) {
            }
            await company.save();
        }
    }

    return apihelper.APIResponseOK(res, true, "Berhasil menghapus document.", undefined);

}))


module.exports = router;