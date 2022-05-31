const config = require('../config/config');
const router = require('express').Router();
const LogCostumerService = require('../models/LogCostumerService');
const Admin = require('../models/Admin');
const moment = require('moment');
const Role = require('../models/Role');

const apiHelper = require('../helper/APIHelper');

var ObjectID = require('mongodb').ObjectID;

router.get("/", apiHelper.authAccessOr({ LOGCOSTUMERSERVICE: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ caller_name: q });
        finalQuery["$or"].push({ caller_phone_number: q });
        finalQuery["$or"].push({ caller_question_category: q });
        finalQuery["$or"].push({ caller_current_status: q });
    }

    var result = LogCostumerService.paginate(finalQuery, {
        select:
            `_id 
        caller_name 
        caller_phone_number 
        caller_question_category 
        caller_note 
        caller_current_status
        caller_handled_by
        created_at 
        updated_at`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data);
    });
}))

router.get("/detail/:id", apiHelper.authAccessOr({ LOGCOSTUMERSERVICE: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = { _id: id }

    var data = await LogCostumerService.findOne(finalQuery).exec();
    if (apiHelper.isEmptyObj(data))
        return apiHelper.APIResponseNF(res, false, "Data tidak ditemukan", undefined);
    
    var admin = await Admin.findOne({_id : data.caller_handler_id}).exec()

    var handler = "-"
    if(admin != undefined){
        var role = await Role.findOne({_id : admin.role}).exec()
        
        handler = {
            admin_id : admin._id,
            admin_name : admin.name,
            admin_role : role.name
        }
    }

    var result = {
        _id: data._id,
        caller_name: data.caller_name,
        caller_phone_number: data.phone_number,
        caller_question_category: data.caller_question_category,
        caller_note: data.caller_note,
        caller_current_status: data.caller_current_status,
        caller_handled_by: data.caller_handled_by,
        created_at : data.created_at,
        updated_at: data.updated_at,
        handler_data: handler
    }
    
    return apiHelper.APIResponseOK(res, true, undefined, result);
}))

router.post("/create_log", apiHelper.authAccessOr({ LOGCOSTUMERSERVICE: config.action.Create }), apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apiHelper.isEmptyObj(data.caller_name))
        return apiHelper.APIResponseBR(res, false, "Silahkan input nama penelepon", undefined);

    if (apiHelper.isEmptyObj(data.caller_phone_number)) {
        return apiHelper.APIResponseBR(res, false, "Silahkan input nomor penelepon", undefined);
    }
    if (apiHelper.isEmptyObj(data.caller_question_category)) {
        return apiHelper.APIResponseBR(res, false, "Silahkan tentukan kategori untuk panggilan ini", undefined);
    }
    if (apiHelper.isEmptyObj(data.caller_handled_by)) {
        return apiHelper.APIResponseBR(res, false, "Silahkan tentukan orang yang akan handle masalah ini", undefined);
    }
    if (apiHelper.isEmptyObj(data.caller_note)) {
        data.caller_note = "-"
    }

    var callCategory = ""
    switch (data.caller_question_category) {
        case "1":
            callCategory = config.log_costumer_service_category.CATEGORY1
            break;
        case "2":
            callCategory = config.log_costumer_service_category.CATEGORY2
            break;
        case "3":
            callCategory = config.log_costumer_service_category.CATEGORY3
            break;
        case "4":
            callCategory = config.log_costumer_service_category.CATEGORY4
            break;
        case "5":
            callCategory = config.log_costumer_service_category.CATEGORY5
            break;
    }

    var data = {
        caller_name: data.caller_name,
        caller_phone_number: data.caller_phone_number,
        caller_question_category: callCategory,
        caller_note: data.caller_note,
        caller_handled_by: data.caller_handled_by,
        caller_handler_id: data.caller_handler_id,
        caller_current_status: config.log_costumer_service_status.CREATED,
        created_at: moment().utc().toDate(),
        updated_at: moment().utc().toDate()
    }
    var result = await LogCostumerService.create(data);

    if (result) {
        return apiHelper.APIResponseOK(res, true, "Log Panggilan ini Telah Berhasil Dibuat", undefined);
    } else {
        return apiHelper.APIResponseErr(res, false, "Tidak Dapat Membuat Log Panggilan ini, Silahkan Coba lagi", undefined);
    }
}))

router.put("/update_log/:id", apiHelper.authAccessOr({ LOGCOSTUMERSERVICE: config.action.Update }), apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;
    const id = req.params.id;

    if (apiHelper.isEmptyObj(id))
        return apiHelper.APIResponseBR(res, false, "id pada parameter tidak boleh kosong", undefined);

    let status = data.caller_current_status
    switch (status) {
        case "PROSES":
            data.caller_current_status = config.log_costumer_service_status.ON_PROCCESS;
            data.caller_handled_by = req.user;
            data.updated_at = moment().utc().toDate();
            break;
        case "FINISH":
            data.caller_current_status = config.log_costumer_service_status.FINISHED;
            data.caller_handled_by = req.user;
            data.updated_at = moment().utc().toDate();
            break;
        case "CANCEL":
            data.caller_current_status = config.log_costumer_service_status.CANCEL;
            data.caller_handled_by = req.user;
            data.updated_at = moment().utc().toDate();
            break;
        default:
            data.caller_current_status = config.log_costumer_service_status.CREATED;
    }

    var result = await LogCostumerService.findByIdAndUpdate({ _id: id }, data, {
        upsert: true
    }).exec();

    if (result) {
        return apiHelper.APIResponseOK(res, true, "Log Panggilan ini Telah Berhasil Di Update", undefined);
    } else {
        return apiHelper.APIResponseNF(res, false, "Tidak Dapat Melakukan Update Log Panggilan ini, Silahkan Coba lagi", undefined);
    }
}))

router.delete("/delete_log/:id", apiHelper.authAccessOr({ LOGCOSTUMERSERVICE: config.action.Delete }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var result = await LogCostumerService.findByIdAndRemove(id).exec();
    return apiHelper.APIResponseOK(res, true, "Log Untuk Panggilan ini telah berhasil dihapus", undefined);
}))

module.exports = router;