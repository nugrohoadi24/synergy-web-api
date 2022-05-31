const config = require('../config/config');
const router = require('express').Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const Company = require('../models/Company');
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const Subdistrict = require('../models/Subdistrict');
const crypto = require("crypto");
const apihelper = require('../helper/APIHelper');
const jwt = require('jsonwebtoken');
const moment = require('moment');


router.post("/auth", apihelper.handleErrorAsync(async (req, res, next) => {
    var data = await User.findOne({ "userid": req.body.userid }, 'name is_active password').exec();

    //await sleep(3000)
    if (data == null)
        return apihelper.APIResponseOK(res, false, "Invalid user", null);

    var encPass = crypto.createHash("sha256").update(req.body.password).digest("hex");

    if (encPass == data.password) {
        var finalres = data.toObject();
        finalres.password = undefined;
        finalres.token = jwt.sign({ id: data._id }, config.jwtsecret, { expiresIn: 86400 });
        return apihelper.APIResponseOK(res, true, "Success", finalres);
    }

    return apihelper.APIResponseOK(res, false, "Invalid user or password", null);
}))

router.get("/", apihelper.authAccessOr({ MUSER: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {}

    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');

        finalQuery["$or"] = [];
        finalQuery["$or"].push({ nama: q });
        finalQuery["$or"].push({ userId: q });
        finalQuery["$or"].push({ email: q });
        finalQuery["$or"].push({ phone: q });
        finalQuery["$or"].push({ handphone: q });
        finalQuery["$or"].push({ address: q });
    }

    var result = User.paginate(finalQuery, {
        select: "_id userId email nama phone handphone company password is_active created_at created_by updated_at updated_by",
        page: page,
        populate: 'company',
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });

}))


router.get("/detail/:id", apihelper.authAccessOr({ MUSER: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = { _id: id }
    var result = {}
    var dataProvince = {}
    var dataCity = {}
    var dataDistrict = {}
    var dataSubdistrict = {}

    var user = await User.findOne(finalQuery).exec();
    if (apihelper.isEmptyObj(user))
        return apihelper.APIResponseOK(res, false, "Data not found", undefined);

    if (Boolean(user.company))
        user.company = await Company.findOne({ _id: user.company }, "_id name").exec();

    if (Boolean(user.province))
        dataProvince = await Province.findOne({ code: user.province }, "_id name code").exec();

    if (Boolean(user.city))
        dataCity = await City.findOne({ code: user.city }, "_id name code").exec();

    if (Boolean(user.district))
        dataDistrict = await District.findOne({ code: user.district }, "_id name code").exec();

    if (Boolean(user.subdistrict))
        dataSubdistrict = await Subdistrict.findOne({ code: user.subdistrict }, "_id name code").exec();

    if (Boolean(user.updated_by))
        user.updated_by = await Admin.findOne({ _id: user.updated_by }, "_id name").exec();

    if (Boolean(user.created_by))
        user.created_by = await Admin.findOne({ _id: user.created_by }, "_id name").exec();

    if (!Boolean(user.gender))
        user.gender = '';

    result = {
        _id: user._id,
        is_active: user.is_active,
        self_register: user.self_register,
        userId: user.userId,
        nik: user.nik,
        nama: user.nama,
        email: user.email,
        handphone: user.handphone,
        phone: user.phone,
        gender: user.gender,
        password: user.password,
        address_complete: user.address_complete,
        updated_by: user.updated_by,
        policy_count: user.policy_count,
        company: user.company,
        address: user.address,
        bank_acc_no: user.bank_acc_no,
        bank_account_name: user.bank_account_name,
        bank_name: user.bank_name,
        province: dataProvince,
        city: dataCity,
        district: dataDistrict,
        subdistrict: dataSubdistrict,
        zipcode: user.zipcode,
        created_at: user.created_at,
        updated_at: user.updated_at,
        activation_date: user.activation_date,
        dob: user.dob
    }

    return apihelper.APIResponseOK(res, true, "", result);
}))


router.get("/selection/", apihelper.authAccessOr({
    MUSER: config.action.View,
    MPARTICIPANT: config.action.View | config.action.Create | config.action.Update
}), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery } = req.query;

    var finalQuery = { is_active: true }
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery.nama = q;
    }

    var result = User.paginate(finalQuery, {
        select: "_id user_id email handphone nama company",
        page: page,
        limit: parseInt(perpage)
    }).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });

}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.userId))
        return apihelper.APIResponseOK(res, false, "user id harus diisi", undefined);

    if (apihelper.isEmptyObj(data.nama))
        return apihelper.APIResponseOK(res, false, "nama harus diisi", undefined);

    if (!apihelper.isEmptyObj(data.nik)) {
        if (data.nik.length != 16)
            return apihelper.APIResponseOK(res, false, "No KTP Invalid, panjang mesti 16 karakter", undefined);
    }

    if (!apihelper.isEmptyObj(data.email)) {
        if (!apihelper.isEmailValid(data.email)) {
            return apihelper.APIResponseOK(res, false, "Email invalid", undefined);
        }
    }

    if (apihelper.isEmptyObj(data.province))
        return apihelper.APIResponseBR(res, false, "Silahkan pilih provinsi terlebih dahulu!", undefined);

    if (apihelper.isEmptyObj(data.city))
        return apihelper.APIResponseBR(res, false, "Silahkan pilih kota terlebih dahulu!", undefined);

    if (apihelper.isEmptyObj(data.district))
        return apihelper.APIResponseBR(res, false, "Silahkan pilih kecamatan terlebih dahulu!", undefined);

    if (apihelper.isEmptyObj(data.subdistrict))
        return apihelper.APIResponseBR(res, false, "Silahkan pilih keluarahan terlebih dahulu!", undefined);

    var count = await User.countDocuments({ userId: data.userId, _id: { $ne: data._id } }).exec();
    if (count > 0)
        return apihelper.APIResponseOK(res, false, "User Id telah ada sebelumnya, mohon gunakan userId yg lain", undefined);

    if (apihelper.isEmptyObj(data._id)) {
        if (apihelper.isEmptyObj(data.password)) {
            return apihelper.APIResponseOK(res, false, "Password harus diisi", undefined);
        }
    }

    if (Boolean(data.password)) {
        var encPass = crypto.createHash("sha256").update(data.password).digest("hex");
        data.password = encPass;
    } else {
        delete data.password;
    }
    data.address_complete = data.address;

    if (Boolean(data.province)) {
        var province = await Province.findOne({ code: data.province }, "_id name code").exec();
        data.province = province.code
        if (apihelper.isEmptyObj(data.province))
            return apihelper.APIResponseOK(res, false, "provinsi tidak ditemukan", undefined);
        data.address_complete = data.address_complete + " PROVINSI " + province.name;
    }

    if (Boolean(data.city)) {
        var city = await City.findOne({ code: data.city }, "_id name code").exec();
        data.city = city.code
        if (apihelper.isEmptyObj(data.city))
            return apihelper.APIResponseOK(res, false, "kota tidak ditemukan", undefined);

        data.address_complete = data.address_complete + " KOTA " + city.name;
    }

    if (Boolean(data.district)) {
        var district = await District.findOne({ code: data.district }, "_id name code").exec();
        data.district = district.code
        if (apihelper.isEmptyObj(data.district))
            return apihelper.APIResponseOK(res, false, "kecamatan tidak ditemukan", undefined);

        data.address_complete = data.address_complete + " KECAMATAN " + district.name;
    }
    if (Boolean(data.subdistrict)) {
        var subdistrict = await Subdistrict.findOne({ code: data.subdistrict }, "_id name code").exec();
        data.subdistrict = subdistrict.code
        if (apihelper.isEmptyObj(data.subdistrict))
            return apihelper.APIResponseOK(res, false, "kelurahan tidak ditemukan", undefined);

        data.address_complete = data.address_complete + " KELURAHAN " + subdistrict.name;
    }

    if (data._id) {
        data.updated_by = req.user;
        data.updated_at = moment().utc().toDate();
        var result = await User.findByIdAndUpdate({ _id: data._id }, data, {
            upsert: true
        }).exec();
    } else {
        data.created_at = moment().utc().toDate();
        data.created_by = req.user;
        var result = await User.create(data);
    }

    return apihelper.APIResponseOK(res, true, "", undefined);
})

router.put("/", apihelper.authAccessOr({ MUSER: config.action.Create }), dataFunc)

router.post("/", apihelper.authAccessOr({ MUSER: config.action.Update }), dataFunc)

router.delete("/:id", apihelper.authAccessOr({ MUSER: config.action.Delete }), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await User.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true, "", undefined);
}))


module.exports = router;