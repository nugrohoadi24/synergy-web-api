const config = require('../config/config');
const router = require('express').Router();
const Admin = require('../models/Admin');
const HumanResource = require('../models/HumanResource')
const Role = require('../models/Role');
const crypto = require("crypto");
const apihelper = require('../helper/APIHelper');
const jwt = require('jsonwebtoken');

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}


router.post("/auth", apihelper.handleErrorAsync(async (req, res, next) => {
    var admin = await Admin.findOne({ "userid": { $regex: new RegExp('^' + req.body.userid + '$', "i") } }, 'name is_active password').populate('role').exec();
        if (admin == null)
            return apihelper.APIResponseBR(res, false, "Invalid User", null);

        var encPass = crypto.createHash("sha256").update(req.body.password).digest("hex");

        if (encPass == admin.password) {
            var finalres = {};
            var access = {};
            if (Boolean(admin.role.access))
                access = admin.role.access;

            var dataUser = {
                id: admin._id,
                name: admin.name,
                role: admin.role.code,
                access: access
            };

            finalres.token = jwt.sign(dataUser, config.jwtsecret, { expiresIn: 86400 });
            finalres.access = access;
            return apihelper.APIResponseOK(res, true, "Berhasil Login Sebagai Admin", finalres);
        }
        return apihelper.APIResponseBR(res, false, "Invalid user or password", null);
}))

router.post("/change_pass", apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.password))
        return apihelper.APIResponseOK(res, false, "new password harus diisi", undefined);

    if (data.password.length < 5)
        return apihelper.APIResponseOK(res, false, "new password harus lebih panjang dari 6 karakter", undefined);

    if (apihelper.isEmptyObj(data.oldPassword))
        return apihelper.APIResponseOK(res, false, "password lama harus diisi", undefined);

    var adminData = await Admin.findOne({ _id: req.userId }).exec();
    if (apihelper.isEmptyObj(adminData)) {
        return apihelper.APIResponseOK(res, false, "Data admin tidak ditemukan", undefined);
    }


    var oldPasswordEnc = crypto.createHash("sha256").update(data.oldPassword).digest("hex");
    if (oldPasswordEnc == adminData.password) {
        adminData.password = encPass = crypto.createHash("sha256").update(data.password).digest("hex");
        await adminData.save();
    } else {
        return apihelper.APIResponseOK(res, false, "Password lama anda tidak sesuai", undefined);
    }

    return apihelper.APIResponseOK(res, true, "Sukses update password", undefined);
}))


router.get("/", apihelper.authAccessOr({ MADMIN: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {}
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = { name: q };
    }

    var result = Admin.paginate(finalQuery, {
        select: "_id userid name role password is_active created_at updated_at",
        page: page,
        populate: 'role',
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });

}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;
    if (Boolean(data.password)) {
        var encPass = crypto.createHash("sha256").update(data.password).digest("hex");
        data.password = encPass;
    } else {
        delete data.password;
    }

    if (data._id) {
        var result = await Admin.findByIdAndUpdate({ _id: data._id }, data, {
            upsert: true
        }).exec();
    } else {
        var result = await Admin.create(data);
    }

    return apihelper.APIResponseOK(res, true, "", undefined);
})

router.put("/", apihelper.authAccessOr({ MADMIN: config.action.Create }), dataFunc)

router.post("/", apihelper.authAccessOr({ MADMIN: config.action.Update }), dataFunc)

router.delete("/:id", apihelper.authAccessOr({ MADMIN: config.action.Delete }), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Admin.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true, "", undefined);
}))




module.exports = router;