const config = require('../config/config');
const router = require('express').Router();

const User = require('../models/User');
const Company = require('../models/Company');
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const Subdistrict = require('../models/Subdistrict');
const UserPolicy = require('../models/UserPolicy');
const Hospital = require('../models/Hospital');
const UserClaim = require('../models/UserClaim');
const Faq = require('../models/Faq');
const Announcement = require('../models/Announcement');
const History = require('../models/History');
const ClaimLimitOptionSchema = require('../models/ClaimLimitOption');
const Counter = require('../models/Counter');
const DigitalForm = require('../models/DigitalForm')
const ListBank = require('../models/Bank');
const ProductCategory = require('../models/ProductCategory');
const Voucher = require('../models/Voucher');
const VoucherWallet = require('../models/VoucherWallet');
const OrderTransaction = require('../models/OrderTransaction');
const CounterSchema = require('../models/Counter');
const UploadTemp = require('../models/UploadTemp');
const VirtualAccount = require('../models/VirtualAccount');
const Ewallet = require('../models/ElectronicWallet')
const Membership = require('../models/Membership')

const crypto = require("crypto");
const strHelper = require('../helper/StringHelper');
const apihelper = require('../helper/APIHelper');
const apiHelper = require('../helper/APIHelper'); // Males Refactor Jadi kedepannya pake penamaan variable yang ini.
const jwt = require('jsonwebtoken');
const moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');
var mime = require('mime');
const mongoose = require('mongoose');

const fetch = require("node-fetch")
const stringHelper = require('../helper/StringHelper')

//Header nodefetch
const fetchHeader = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(`${config.xendit_secret_key}:""`, 'binary').toString('base64')
}

// Virtual Account Name
var nameVA = "Salvus Health"


const authM = apihelper.auth(['USR']);

router.post("/auth", apihelper.handleErrorAsync(async (req, res, next) => {

    if (apihelper.isEmptyObj(req.body.userid))
        return apihelper.APIResponseOK(res, false, "User harus di input", undefined);

    if (apihelper.isEmptyObj(req.body.password))
        return apihelper.APIResponseOK(res, false, "Password harus di input", undefined);

    var q = new RegExp(req.body.userid, 'i');
    finalQuery = { $or: [{ userId: q }, { email: q }, { handphone: q }] };


    var data = await User.findOne(finalQuery, '_id nama avatar email userId gender handphone phone nik address password self_register is_active company').exec();
    if (data == null)
        return apihelper.APIResponseOK(res, false, "Invalid user", null);

    if (data.is_active) {
        if (req.body.password.toLowerCase() == data.password.toLowerCase()) {
            var finalres = {};
            var sesid = new ObjectID();

            var encSes = crypto.createHash("sha256").update(sesid.toString() + data.userId).digest("hex");
            data.session = encSes;
            await data.save();


            var userPolicy = await UserPolicy.find({
                user: data._id
            }, 'certificate_no card_no nama_tertanggung dob_tertanggung policy_date policy_end_date product_type gender_tertanggung is_active').lean().exec();

            if (userPolicy != null) {
                for (var key in userPolicy) {
                    var tmpdata = userPolicy[key];

                    var dt1 = moment(tmpdata.policy_date).startOf('day');
                    var dt2 = moment(tmpdata.policy_end_date).startOf('day');
                    var currentDt = moment().startOf('day');

                    if (tmpdata.is_active) {
                        if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
                            tmpdata.status_polis = "EXPIRED";
                        } else {
                            tmpdata.status_polis = "ACTIVE";
                        }
                    } else {
                        tmpdata.status_polis = "NON-ACTIVE";
                    }
                }
            }

            finalres.token = jwt.sign({
                id: data._id,
                email: data.email,
                nama: data.nama,
                userId: data.userId,
                handphone: data.handphone,
                gender: data.gender,
                avatar: data.avatar,
                self_register: data.self_register,
                role: 'USR',
                policy: userPolicy
            }, config.jwtsecret, { expiresIn: 86400 });

            finalres.refreshtoken = jwt.sign({
                id: data._id,
                email: data.email,
                nama: data.nama,
                userId: data.userId,
                session: encSes
            }, config.jwtsecret, { expiresIn: 604800 });

            return apihelper.APIResponseOK(res, true, "Sukses", finalres);
        } else {
            return apihelper.APIResponseOK(res, false, "User ID atau Sandi tidak valid", undefined);
        }
    } else {
        return apihelper.APIResponseOK(res, false, "Akun Anda belum aktif, silahkan lakukan aktivasi melalui link yang kami kirimkan ke email Anda", undefined);
    }

    return apihelper.APIResponseOK(res, false, "User ID atau Password tidak valid", null);
}))


router.post("/refreshtoken", apihelper.handleErrorAsync(async (req, res, next) => {
    var refreshToken = req.headers.authorization.split(' ')[1];
    var decodedToken
    try {
        decodedToken = jwt.verify(refreshToken, config.jwtsecret);
    } catch (err) {
        console.log(err)
    }
    if (Boolean(decodedToken)) {
        var data = await User.findOne({ _id: decodedToken.id },
            `_id
              nama
              avatar 
              email 
              userId 
              gender 
              handphone 
              phone 
              nik 
              address 
              password 
              self_register 
              is_active 
              company
              session`).exec();
        if (Boolean(data)) {
            var userPolicy = await UserPolicy.find({
                user: data._id
            }, 'certificate_no card_no nama_tertanggung dob_tertanggung policy_date policy_end_date gender_tertanggung is_active').lean().exec();

            if (userPolicy != null) {
                for (var key in userPolicy) {
                    var tmpdata = userPolicy[key];

                    var dt1 = moment(tmpdata.policy_date).startOf('day');
                    var dt2 = moment(tmpdata.policy_end_date).startOf('day');
                    var currentDt = moment().startOf('day');

                    if (tmpdata.is_active) {
                        if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
                            tmpdata.status_polis = "EXPIRED";
                        } else {
                            tmpdata.status_polis = "ACTIVE";
                        }
                    } else {
                        tmpdata.status_polis = "NON-ACTIVE";
                    }
                }
            }

            if (data.session == decodedToken.session) {
                var finalres = {}
                finalres.token = jwt.sign({
                    id: data._id,
                    email: data.email,
                    nama: data.nama,
                    userId: data.userId,
                    handphone: data.handphone,
                    gender: data.gender,
                    avatar: data.avatar,
                    self_register: data.self_register,
                    role: 'USR',
                    policy: userPolicy
                }, config.jwtsecret, { expiresIn: 86400 });

                finalres.refreshtoken = jwt.sign({
                    id: data._id,
                    email: data.email,
                    nama: data.nama,
                    userId: data.userId
                }, config.jwtsecret, { expiresIn: 604800 });
                return apihelper.APIResponseOK(res, true, "Berhasil Memperbarui Token", finalres);
            } else {
                return apihelper.APIResponseOK(res, false, "Anda Telah Masuk Di Perangkat lain, silahkan login kembali !", null);
            }
        } else {
            return apihelper.APIResponseBR(res, false, "Invalid token", null);
        }
    } else {
        return apihelper.APIResponseOK(res, false, "Akun ini tidak login dalam 7 Hari, Silahkan Login Kembali !", null);
    }
}))

router.post("/register", apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.nama))
        return apihelper.APIResponseOK(res, false, "Silahkan input nama Anda", undefined);

    if (apihelper.isEmptyObj(data.email)) {
        return apihelper.APIResponseOK(res, false, "Silahkan input alamat email Anda", undefined);
    } else {
        if (!apihelper.isEmailValid(data.email)) {
            return apihelper.APIResponseOK(res, false, "Silahkan input alamat email yang valid", undefined);
        }
    }

    if (apihelper.isEmptyObj(data.password))
        return apihelper.APIResponseOK(res, false, "Silahkan input sandi Anda", undefined);
    else if (data.password.length < 6)
        return apihelper.APIResponseOK(res, false, "Panjang sandi minimal 6 digit, dan disarankan terdiri dari kombinasi huruf besar dan kecil", undefined);

    if (!apihelper.isEmptyObj(data.gender)) {
        if (data.gender != 'M' && data.gender != 'F')
            return apihelper.APIResponseOK(res, false, "Silahkan input jenis kelamin", undefined);
    }

    var qemail = new RegExp(data.email, 'i');
    var or = [{ userId: qemail }, { email: qemail }];
    var finalQuery = {};
    if (Boolean(data.phone)) {
        var qhandphone = new RegExp(data.phone, 'i');
        or.push({ handphone: qhandphone });
    }
    finalQuery["$or"] = or;

    var prevData = await User.findOne(finalQuery).exec();
    if (prevData != null)
        return apihelper.APIResponseOK(res, false, "Alamat email dan/atau nomor handphone telah terdaftar. Silahkan gunakan yang lain", null);

    var dataNewUser = {
        userId: data.email,
        nama: data.nama,
        email: data.email,
        handphone: data.phone,
        gender: data.gender,
        self_register: true,
        password: crypto.createHash("sha256").update(data.password).digest("hex"),
        created_at: moment().utc().toDate()
    }
    var result = await User.create(dataNewUser);

    var activatetoken = jwt.sign({
        id: result._id
    }, config.jwtsecret, { expiresIn: 3600 });


    var emailContent = "<hmtl><head><style> * {font-size: 1.1em; line-height: 1.5}</style></head><body><a href='" + config.activationLink + activatetoken + "'>Klik untuk aktivasi akun Salute Anda</a> <br/> Setelah klik link di atas, buka kembali Salute App dan Masuk (Login) menggunakan alamat email atau nomor handphone dan sandi yang telah Anda daftarkan.<br/><br/>Salam sehat, Salvus Health</body></html>";


    var resultEmail = await apihelper.sendEmailNocc(data.email, "Link Aktivasi Akun Salute Anda", emailContent, null);

    if (result) {
        return apihelper.APIResponseOK(res, true, "User ID Anda berhasil didaftarkan", null);
    } else {
        return apihelper.APIResponseOK(res, true, "Tidak dapat didaftarkan, silahkan periksa keterangan yang Anda input dan ulangi pendaftaran", null);
    }
}))

router.post("/resend", apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.userid)) {
        return apihelper.APIResponseOK(res, false, "Silahkan input User ID Anda", undefined);
    }

    var qemail = new RegExp(data.userid, 'i');
    var $or = [{ userId: qemail }, { email: qemail }];
    if (Boolean(data.handphone)) {
        var qhandphone = new RegExp(data.handphone, 'i');
        $or.push({ handphone: qhandphone });
    }
    finalQuery = { $or };

    var userdata = await User.findOne(finalQuery).exec();
    if (userdata == null)
        return apihelper.APIResponseOK(res, false, "User tidak ditemukan. Silahkan input alamat email atau nomor handphone yang telah terdaftar", null);


    if (!Boolean(userdata.email)) {
        return apihelper.APIResponseOK(res, false, "User belum memiliki email, silahkan hubungi CS untuk informasi lebih lanjut", null);
    }

    var activatetoken = jwt.sign({
        id: userdata._id
    }, config.jwtsecret, { expiresIn: 3600 });


    var emailContent = "<hmtl><head><style> * {font-size: 1.1em; line-height: 1.5}</style></head><body><a href='" + config.activationLink + activatetoken + "'>Klik untuk aktivasi akun Salute Anda</a> <br/> Setelah klik link di atas, buka kembali Salute App dan Masuk (Login) menggunakan alamat email atau nomor handphone dan sandi yang telah Anda daftarkan.<br/><br/>Salam sehat, Salvus Health</body></html>";

    var resultEmail = await apihelper.sendEmailNocc(userdata.email, "Link Aktivasi Akun Salute Anda", emailContent, null);

    if (resultEmail) {
        return apihelper.APIResponseOK(res, true, "Link aktivasi akun telah dikirimkan ke alamat email Anda", null);
    } else {
        return apihelper.APIResponseOK(res, true, "Tidak dapat didaftarkan, silahkan periksa keterangan yang Anda input dan ulangi pendaftaran", null);
    }
}))

router.post("/reset_pass", apihelper.handleErrorAsync(async (req, res, next) => {
    var token = req.query.token;



    if (!Boolean(req.body.userId))
        return apihelper.APIResponseOK(res, false, "Silahkan isi alamat email anda", null);

    var q = new RegExp(req.body.userId, 'i');
    var finalQuery = { $or: [{ userId: q }, { email: q }] };

    var data = await User.findOne(finalQuery).exec();
    if (data == null || apihelper.isEmptyObj(data.email))
        return apihelper.APIResponseOK(res, false, "Alamat email tidak ditemukan. Silahkan hubungi customer service Salvus Health", null);

    data.reset_token = jwt.sign({
        email: req.body.userId
    }, config.jwtsecret, { expiresIn: 15 * 60 });

    var emailContent = "<hmtl><head><style> * {font-size: 1.1em; line-height: 1.5}</style></head><body>Silahkan atur ulang sandi akun Anda dengan klik link berikut: <a href='" + config.resetpasswordLink + data.reset_token + "' >Link Reset Password</a></body></html>";

    var resultEmail = await apihelper.sendEmailNocc(data.email, "Reset Password", emailContent, null);

    await data.save();

    return apihelper.APIResponseOK(res, true, "Silahkan segera cek email Anda. Link untuk atur ulang sandi telah dikirimkan ke " + data.email + ". Link hanya berlaku selama 15 menit", null);
}))

router.post("/confirm_reset_pass", apihelper.handleErrorAsync(async (req, res, next) => {
    if (!Boolean(req.body.token))
        return apihelper.APIResponseOK(res, false, "Silahkan isi User ID Anda", null);

    if (!Boolean(req.body.password))
        return apihelper.APIResponseOK(res, false, "Silahkan isi sandi Anda", null);
    else if (req.body.password.length < 6)
        return apihelper.APIResponseOK(res, false, "Panjang sandi minimal 6 karakter, dan disarankan terdiri dari kombinasi huruf besar dan kecil", undefined);

    const decodedToken = jwt.verify(req.body.token, config.jwtsecret);
    var q = new RegExp(decodedToken.email, 'i');
    var data = await User.findOne({ reset_token: req.body.token, email: q }).exec();
    if (data == null)
        return apihelper.APIResponseOK(res, false, "User tidak ditemukan. Silahkan periksa kembali User ID yang Anda input", null);


    data.reset_token = "";
    data.password = crypto.createHash("sha256").update(req.body.password).digest("hex"),

        await data.save();

    return apihelper.APIResponseOK(res, true, "Sandi anda berhasil diatur ulang. Silahkan masuk menggunakan sandi baru Anda", null);
}))



router.get("/activate", apihelper.handleErrorAsync(async (req, res, next) => {
    var token = req.query.token;
    const decodedToken = jwt.verify(token, config.jwtsecret);
    if (!Boolean(decodedToken)) {
        res.writeHead(301,
            { Location: config.msgActionLink + "2" }
        );
        res.end();
        return;
    } else {
        var finalQuery = { _id: ObjectID(decodedToken.id) };

        var data = await User.findOne(finalQuery).exec();
        if (data == null) {
            res.writeHead(301,
                { Location: config.msgActionLink + "2" }
            );
            res.end();
            return;
        }
        data.is_active = true;
        data.activation_date = moment().utc().toDate();
        await data.save();

        res.writeHead(301,
            { Location: config.msgActionLink + "1" }
        );
        res.end();
    }
}))

// Endpoint yang digunakan untuk memeriksa versi salute
router.get("/verify_version", apihelper.handleErrorAsync(async (req, res, next) => {

    var data = {
        version: config.salute_latest_ver
    }

    return apiHelper.APIResponseOK(res, true, "Berhasil mendapat data terbaru", data)
}))


router.get("/user_detail", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { _id: req.userId }
    var result = {}
    var dataProvince = {}
    var dataCity = {}
    var dataDistrict = {}
    var dataSubdistrict = {}

    var user = await User.findOne(finalQuery, 'userId nama avatar email gender phone handphone nik address province city district subdistrict zipcode bank_acc_no bank_name bank_account_name self_register company').lean().exec();

    if (apihelper.isEmptyObj(user))
        return apihelper.APIResponseErr(res, false, "User tidak ditemukan", claim);

    if (Boolean(user.company))
        result.company = await Company.findOne({ _id: user.company }, "_id name code").exec();
    else
        result.company = undefined

    if (Boolean(user.province))
        dataProvince = await Province.findOne({ code: user.province }, "_id name code").exec();

    if (Boolean(user.city))
        dataCity = await City.findOne({ code: user.city }, "_id name code").exec();

    if (Boolean(user.district))
        dataDistrict = await District.findOne({ code: user.district }, "_id name code").exec();

    if (Boolean(user.subdistrict))
        dataSubdistrict = await Subdistrict.findOne({ code: user.subdistrict }, "_id name code").exec();


    var dataPolicy = await UserPolicy.find({
        user: user._id
    }, 'certificate_no card_no nama_tertanggung dob_tertanggung policy_date gender_tertanggung is_active product_type nik_tertanggung dob_tertanggung').lean().exec();

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
        policy: dataPolicy
    }

    return apihelper.APIResponseOK(res, true, "", result);
}))

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

router.get("/master/province", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = {}
    //await sleep(2000);
    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery.name = q;
    }

    var result = await Province.find(finalQuery, 'code name').lean().exec();
    return apihelper.APIResponseOK(res, true, "", result);
}))

router.get("/master/city/:province", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { province: req.params.province }

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery.name = q;
    }


    var result = await City.find(finalQuery, 'code name').lean().exec();
    return apihelper.APIResponseOK(res, true, "", result);
}))


router.get("/master/district/:city", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { city: req.params.city }
    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery.name = q;
    }

    var result = await District.find(finalQuery, 'code name').lean().exec();
    return apihelper.APIResponseOK(res, true, "", result);
}))

router.get("/master/subdistrict/:district", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { district: req.params.district }
    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery.name = q;
    }

    var result = await Subdistrict.find(finalQuery, 'code name').lean().exec();
    return apihelper.APIResponseOK(res, true, "", result);
}))

// For Web Purposes
router.get("/city/all", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ code: q });
    }

    var result = City.paginate(finalQuery, {
        select:
            `
        _id
        code 
        name
        is_active
        province`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data);
    });
}))

router.get("/district/all", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ code: q });
    }

    var result = Subdistrict.paginate(finalQuery, {
        select:
            `
        _id
        code 
        name
        is_active
        district`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data);
    });
}))

router.get("/subdistrict/all", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ code: q });
    }

    var result = District.paginate(finalQuery, {
        select:
            `
        _id
        code 
        name
        is_active
        city`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data);
    });
}))



router.put("/update_user", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.nama))
        return apihelper.APIResponseOK(res, false, "nama harus diisi", undefined);

    if (apihelper.isEmptyObj(data.email))
        return apihelper.APIResponseOK(res, false, "email harus diisi", undefined);
    else
        if (!apihelper.isEmailValid(data.email)) {
            return apihelper.APIResponseOK(res, false, "Email invalid", undefined);
        }

    if (!apihelper.isEmptyObj(data.nik)) {
        if (data.nik.length != 16)
            return apihelper.APIResponseOK(res, false, "Nomor KTP Invalid, silahkan periksa kembali dan input 16 digit nomor KTP", undefined);
    }

    if (Boolean(data.current_password) && Boolean(data.new_password)) {
        if (data.new_password.length < 6)
            return apihelper.APIResponseOK(res, false, "Panjang sandi baru minimal 6 karakter", undefined);
    }

    var $or = [];
    if (Boolean(data.email)) {
        var qemail = new RegExp(data.email, 'i');
        $or.push({ email: qemail });
    }

    if (Boolean(data.handphone)) {
        var qhandphone = new RegExp(data.handphone, 'i');
        $or.push({ handphone: qhandphone });
    }
    finalQuery = { $or };

    var prevData = await User.findOne(finalQuery, '_id').exec();
    if (prevData != null && prevData._id.toString() != req.userId)
        return apihelper.APIResponseOK(res, false, "Alamat email dan/atau nomor handphone telah terdaftar. Silahkan gunakan alamat email dan/atau nomor handphone lain", null);


    var currentUserData = await User.findOne({ _id: req.userId });
    if (apihelper.isEmptyObj(currentUserData))
        return apihelper.APIResponseOK(res, false, "User tidak ditemukan", undefined);

    currentUserData.nama = data.nama;
    currentUserData.email = data.email;
    if (apihelper.isEmptyObj(currentUserData.nik))
        currentUserData.nik = data.nik;

    currentUserData.address = data.address;
    currentUserData.province = data.province;
    currentUserData.city = data.city;
    currentUserData.district = data.district;
    currentUserData.subdistrict = data.subdistrict;
    currentUserData.zipcode = data.zipcode;
    currentUserData.phone = data.phone;
    currentUserData.handphone = data.handphone;

    if (apihelper.isEmptyObj(currentUserData.bank_acc_no))
        currentUserData.bank_acc_no = data.bank_acc_no;

    if (apihelper.isEmptyObj(currentUserData.bank_name))
        currentUserData.bank_name = data.bank_name;

    if (apihelper.isEmptyObj(currentUserData.bank_account_name))
        currentUserData.bank_account_name = data.bank_account_name;

    if (Boolean(data.current_password) && Boolean(data.new_password)) {
        var currentPassEnc = crypto.createHash("sha256").update(data.current_password).digest("hex");
        if (currentUserData.password == currentPassEnc) {
            var encPass = crypto.createHash("sha256").update(data.new_password).digest("hex");
            currentUserData.password = encPass;
        } else {
            return apihelper.APIResponseOK(res, false, "Sandi tidak sesuai, silahkan periksa kembali", undefined);
        }
    }


    currentUserData.address_complete = currentUserData.address;
    if (Boolean(data.province)) {
        data.province = await Province.findOne({ code: data.province }, "_id name").exec();
        if (apihelper.isEmptyObj(data.province))
            return apihelper.APIResponseOK(res, false, "Province tidak ditemukan", undefined);
        currentUserData.address_complete = currentUserData.address_complete + " Prov " + data.province.name;
    }

    if (Boolean(data.city)) {
        data.city = await City.findOne({ code: data.city }, "_id name").exec();
        if (apihelper.isEmptyObj(data.city))
            return apihelper.APIResponseOK(res, false, "City tidak ditemukan", undefined);

        currentUserData.address_complete = currentUserData.address_complete + " Kota " + data.city.name;
    }

    if (Boolean(data.district)) {
        data.district = await District.findOne({ code: data.district }, "_id name").exec();
        if (apihelper.isEmptyObj(data.district))
            return apihelper.APIResponseOK(res, false, "District tidak ditemukan", undefined);

        currentUserData.address_complete = currentUserData.address_complete + " Kecamatan " + data.district.name;
    }
    if (Boolean(data.subdistrict)) {
        data.subdistrict = await Subdistrict.findOne({ code: data.subdistrict }, "_id name").exec();
        if (apihelper.isEmptyObj(data.subdistrict))
            return apihelper.APIResponseOK(res, false, "Subdistrict tidak ditemukan", undefined);

        currentUserData.address_complete = currentUserData.address_complete + " Kelurahan " + data.subdistrict.name;
    }

    currentUserData.updated_by = req.user;
    currentUserData.updated_at = moment().utc().toDate();
    await currentUserData.save();

    return apihelper.APIResponseOK(res, true, "Data Anda berhasil diperbarui", undefined);
}))

router.post("/upload_avatar", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query;

    var finalQuery = { _id: req.userId }
    var user = await User.findOne(finalQuery).exec();

    if (apihelper.isEmptyObj(user))
        return apihelper.APIResponseErr(res, false, "User tidak ditemukan", null);

    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp')) {
            return apihelper.APIResponseErr(res, false, "Gunakan file format jpg, jpeg, png atau bmp", null);
        }

        var fileAbsPath = ``;
        fileAbsPath = `/avatar/`;

        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }

        var fileName = strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        file.on('limit', function () {
            fs.unlink(path, function () {
                limit_reach = true;
                res.status(455).send(limit_reach_err);
            });
        });

        fstream.on('close', function () {
            var stats = fs.statSync(config.uploadTempPath + fileAbsPath + fileName);

            if (Boolean(user.avatar)) {
                try {
                    fs.unlink(config.uploadTempPath + fileAbsPath + fileName);
                } catch (xe) {

                }
            }
            user.avatar = fileAbsPath + fileName;

            user.save(function (err, model) {
                if (err) {
                    fs.unlink(config.uploadTempPath + fileAbsPath + fileName);
                    return apihelper.APIResponseOK(res, false, err, undefined);
                }

                return apihelper.APIResponseOK(res, true, "", {
                    image: fileAbsPath + fileName
                });
            });
        });
    });
}))


router.get("/master/provider/:type", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { type: req.params.type, is_active: true }
    const { page, perpage } = req.query;
    var dataResult = {}

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ address_complete: q });
    }

    var result = Hospital.paginate(finalQuery, {
        select: "code name address address_complete phone1 longitude latitude zipcode",
        page: page,
        limit: parseInt(perpage),
        sort: "name"
    },
    ).then(data => {
        if (apiHelper.isEmptyObj(data.docs)) {
            return apihelper.APIResponseNF(res, false, "Data Tidak Ditemukan", undefined);
        } else {
            return apihelper.APIResponseOK(res, true, "", data.docs);
        }

    });

}))

router.get("/master/provider/web/:type", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { type: req.params.type, is_active: true }
    const { page, perpage } = req.query;
    var dataResult = {}

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ address_complete: q });
    }

    var result = Hospital.paginate(finalQuery, {
        select: "code name address address_complete phone1 longitude latitude zipcode",
        page: page,
        limit: parseInt(perpage),
        sort: "name"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });

}))

router.get("/master/provider_all", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { is_active: true }
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ address_complete: q });
    }

    var result = Hospital.paginate(finalQuery, {
        select: "code name address address_complete phone1 longitude latitude zipcode",
        page: page,
        limit: parseInt(perpage),
        sort: "name"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data.docs);
    });
}))

router.get("/master/provider_all/web", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { is_active: true }
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ name: q });
        finalQuery["$or"].push({ address_complete: q });
    }

    var result = Hospital.paginate(finalQuery, {
        select: "code name address address_complete phone1 longitude latitude zipcode",
        page: page,
        limit: parseInt(perpage),
        sort: "name"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });
}))

router.get("/master/provider/detail/:providerid", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { _id: ObjectID(req.params.providerid), is_active: true }
    var result = await Hospital.findOne(finalQuery, 'code name address address_complete phone1 phone2 admin_email longitude latitude zipcode').lean().exec();

    return apihelper.APIResponseOK(res, true, "", result);
}))

router.get("/claim/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { user: new ObjectID(req.userId) }
    const { page, perpage } = req.query;

    var ppage = 1;
    if (Boolean(page))
        ppage = page

    var pperpage = 10
    if (Boolean(perpage))
        pperpage = perpage;

    var result1 = await UserClaim.aggregate([
        { $match: finalQuery },
        {
            $lookup:
            {
                from: "hospital",
                localField: "hospital",
                foreignField: "_id",
                as: "hospital"
            }
        },
        { "$unwind": "$hospital" },
        {
            $addFields: { "hospital_name": "$hospital.name" }
        },
        {
            $project: {
                'claim_no': 1, 'card_no': 1, 'user_id': 1, 'created_at': 1, 'hospital_name': 1, 'claim_status': 1, 'paid_date': 1,
                'document': {
                    $filter: {
                        input: '$document',
                        as: 'item',
                        cond: { $eq: ['$$item.type', 'RESUME_MEDIS'] }
                    }
                }
            }
        },
        { "$sort": { "created_at": -1 } },
        { "$skip": (parseInt(ppage) - 1) * parseInt(pperpage) },
        { "$limit": parseInt(pperpage) }
    ]).exec();

    for (var key in result1) {
        var temp = result1[key]
        temp.status_text = config.claim_status_text[temp.claim_status];
    }

    return apihelper.APIResponseOK(res, true, "", result1);

}))



router.get("/claim/detail/:claimId", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = { _id: new ObjectID(req.params.claimId), user: new ObjectID(req.userId) }

    var result1 = await UserClaim.aggregate([
        { $match: finalQuery },
        {
            $lookup:
            {
                from: "hospital",
                localField: "hospital",
                foreignField: "_id",
                as: "hospital"
            }
        },
        { "$unwind": "$hospital" },
        {
            $addFields: { "hospital_name": "$hospital.name" }
        },
        {
            $project: {
                'claim_no': 1, 'created_at': 1, 'cashless': 1, 'admission_date': 1, 'discharge_date': 1, 'accident_description': 1, 'claim_reason': 1,
                'document': 1, 'claim_total_amount': 1, 'covered_total_amount': 1, 'excess_total_amount': 1, 'paid_date': 1
            }
        },
        { "$limit": 1 }
    ]).exec();

    return apihelper.APIResponseOK(res, true, "", result1[0]);
}))


router.post("/claim/upload/:claimId/:docType", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query;
    const claimId = req.params.claimId;
    const docType = req.params.docType

    var finalQuery = { _id: new ObjectID(claimId), user: new ObjectID(req.userId) }

    var claim = await UserClaim.findOne(finalQuery).exec();
    if (apihelper.isEmptyObj(claim))
        return apihelper.APIResponseErr(res, false, "Detail Claim tidak ditemukan", claim);

    if (!(['CREATED', 'SJM_CREATED', 'SJM_SENT', 'CLAIM_DETAIL', 'SPB_CREATED', 'SPB_SENT', 'PROCESSED'].includes(claim.claim_status)))
        return apihelper.APIResponseErr(res, false, "Tidak dapat mengedit dokument, status dokument invalid", null);

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp')) {
            return apihelper.APIResponseErr(res, false, "Gunakan file format jpg, jpeg, png atau bmp", null);
        }

        var fileAbsPath = `/claim_document/${claim._id}/`;
        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }
        var fileName = "salute_" + strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        fstream.on('close', function () {
            var stats = fs.statSync(config.uploadTempPath + fileAbsPath + fileName);
            var newImage = {
                _id: new ObjectID(),
                size: stats.size,
                name: filename,
                mimetype: mimetype,
                path: fileAbsPath + fileName,
                upload_at: moment().utc(),
                upload_by: req.userId,
                type: docType
            }
            var index = 0;
            var tmpArray = [];
            claim.document.forEach(doc => {
                if (doc.upload_by == req.userId && doc.type == docType) {
                    var fileAbsPath = config.uploadTempPath + doc.path;
                    try {
                        fs.unlinkSync(fileAbsPath);
                    } catch (e) {
                    }
                } else {
                    tmpArray.push(doc);
                }
                index++;
            });
            tmpArray.push(newImage);
            claim.document = tmpArray;

            claim.save(function (err, model) {
                return apihelper.APIResponseOK(res, true, "", newImage);
            });

        });
    });
}))


router.post("/claim/upload/remove/:claimid/:docId", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const claimid = req.params.claimid;
    const docId = req.params.docId

    var finalQuery = { _id: claimid }

    var claim = await UserClaim.findOne(finalQuery).exec();
    if (apihelper.isEmptyObj(claim))
        return apihelper.APIResponseErr(res, false, "Belum ada data klaim", claim);

    if (!(['CREATED', 'SPB_CREATED', 'PROCESSED'].includes(claim.claim_status)))
        return apihelper.APIResponseErr(res, false, "Anda tidak dapat melakukan perubahan data", undefined);

    for (var index = 0; index < claim.document.length; index++) {
        var doc = claim.document[index];
        if (doc._id.toString() == docId) {
            if (doc.upload_by == req.userId) {
                claim.document.splice(index, 1);
                var fileAbsPath = config.uploadTempPath + doc.path;
                try {
                    fs.unlinkSync(fileAbsPath);
                } catch (e) {
                }
                await claim.save();
            } else {
                return apihelper.APIResponseOK(res, false, "Anda tidak dapat melakukan perubahan data", null);
            }
        }
    }

    return apihelper.APIResponseOK(res, true, "", null);
}))



router.get("/master/faq", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var finalQuery = {}
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ question: q });
        finalQuery["$or"].push({ answer: q });
    }

    var result = Faq.paginate(finalQuery, {
        select: "question answer",
        page: page,
        limit: parseInt(perpage),
        sort: "question"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data.docs);
    });

}))



router.get("/announcement/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {

    var finalQuery = {
        is_active: true,
        show_at: { $lt: moment().toDate() }
    }
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ title: q });
    }

    var result = Announcement.paginate(finalQuery, {
        select: "type title show_at",
        page: page,
        limit: parseInt(perpage),
        sort: "-created_at"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data.docs);
    });
}))


router.get("/announcement/detail/:id", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {
        _id: ObjectID(id)
    }
    var result = await Announcement.findOne(finalQuery, "type title short_description description show_at").lean().exec();
    return apihelper.APIResponseOK(res, true, "", result);
}))

router.get("/announcement/check", authM, apihelper.handleErrorAsync(async (req, res, next) => {

    var lastDateTime = moment().subtract(1, 'months');
    if (Boolean(req.query.lastDate))
        lastDateTime = moment(req.query.lastDate);

    var finalQuery = {
        is_active: true,
        $and: [{ show_at: { $lt: moment().toDate() } },
        { show_at: { $gt: lastDateTime } }
        ]
    }


    var resultCount = await Announcement.count(finalQuery).exec();

    return apihelper.APIResponseOK(res, true, "",
        {
            "unreadcount": resultCount
        });
}))



router.get("/history/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {

    var finalQuery = {
        created_at: { $lt: moment().toDate() },
        user: ObjectID(req.userId)
    }
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ title: q });
    }

    var result = History.paginate(finalQuery, {
        select: "type title  description created_at",
        page: page,
        limit: parseInt(perpage),
        sort: "-created_at"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data.docs);
    });
}))

router.get("/history/list/web", authM, apihelper.handleErrorAsync(async (req, res, next) => {

    var finalQuery = {
        created_at: { $lt: moment().toDate() },
        user: ObjectID(req.userId)
    }
    const { page, perpage } = req.query;

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ title: q });
    }

    var result = History.paginate(finalQuery, {
        select: "type title  description created_at",
        page: page,
        limit: parseInt(perpage),
        sort: "-created_at"
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });
}))



router.get("/policy/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var user = new ObjectID(req.userId)

    var result1 = await UserPolicy.aggregate([
        { $match: { "user": user } },
        {
            $lookup: {
                from: "insurance_product",
                localField: "insurance_product",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                'certificate_no': 1, 'card_no': 1, 'is_active': 1, 'nama_tertanggung': 1, 'product.name': 1, '_id': 1, 'policy_date': 1, 'policy_end_date': 1, "is_active": 1, "product_type": 1, "nik_tertanggung": 1, "dob_tertanggung": 1,
                'product.benefit_year_limit': {
                    $filter: {
                        input: '$product.benefit_year_limit',
                        as: 'benefit',
                        cond: { $eq: ['$$benefit.plan_name', '$plan_name'] }
                    }
                }
            }
        },
        { $unwind: "$product.benefit_year_limit" },
        { "$limit": 100 }
    ]).exec();

    if (result1 != null) {
        for (var key in result1) {
            var tmpdata = result1[key];
            tmpdata.policy_id = tmpdata._id;
            tmpdata.product_name = tmpdata.product.name;
            tmpdata.benefit_year_limit = tmpdata.product.benefit_year_limit.limit;
            tmpdata.product = undefined;

            var dt1 = moment(tmpdata.policy_date).startOf('day');
            var dt2 = moment(tmpdata.policy_end_date).startOf('day');
            var currentDt = moment().startOf('day');

            if (tmpdata.is_active) {
                if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
                    tmpdata.status_polis = "EXPIRED";
                } else {
                    tmpdata.status_polis = "ACTIVE";
                }
            } else {
                tmpdata.status_polis = "NON-ACTIVE";
            }
        }
    }
    return apihelper.APIResponseOK(res, true, "", result1);
}))

router.get("/policy/detail/:policyId", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var user = new ObjectID(req.userId)
    var policyId = new ObjectID(req.params.policyId);


    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    var result1 = await UserPolicy.aggregate([
        { $match: { "user": user, _id: policyId } },
        {
            $lookup: {
                from: "insurance_product",
                localField: "insurance_product",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        {
            $project: {
                'certificate_no': 1, 'card_no': 1, 'is_active': 1, 'product.name': 1, 'product.code': 1, 'product.type': 1, 'plan_name': 1, "policy_date": 1, "policy_end_date": 1, "is_active": 1, "product_type": 1, "nik_tertanggung": 1, "dob_tertanggung": 1,
                'product.benefit_year_limit': {
                    $filter: {
                        input: '$product.benefit_year_limit',
                        as: 'benefityear',
                        cond: { $eq: ['$$benefityear.plan_name', '$plan_name'] }
                    }
                },
                'product.benefit.name': 1,
                'product.benefit.unit': 1,
                'product.benefit.unit_name': 1,
                'product.benefit.plan': 1,
            }
        },
        { $unwind: "$product.benefit_year_limit" }
    ]).exec();

    if (result1 != null && result1.length > 0) {
        var tmpdata = result1[0];


        var dt1 = moment(tmpdata.policy_date).startOf('day');
        var dt2 = moment(tmpdata.policy_end_date).startOf('day');
        var currentDt = moment().startOf('day');

        if (tmpdata.is_active) {
            if (currentDt.isAfter(dt2) || currentDt.isBefore(dt1)) {
                tmpdata.status_polis = "EXPIRED";
            } else {
                tmpdata.status_polis = "ACTIVE";
            }
        } else {
            tmpdata.status_polis = "NON-ACTIVE";
        }

        tmpdata.product_code = tmpdata.product.code;
        tmpdata.product_name = tmpdata.product.name;
        tmpdata.product_type = tmpdata.product.type;
        tmpdata.benefit_year_limit = tmpdata.product.benefit_year_limit.limit;

        tmpdata.benefit_year_limit = tmpdata.product.benefit_year_limit[0];
        tmpdata.benefit = tmpdata.product.benefit;
        for (var key1 in tmpdata.product.benefit) {
            var tmpbenefit = tmpdata.product.benefit[key1];

            for (var keyPlan in tmpbenefit.plan) {
                var tmpPlan = tmpbenefit.plan[keyPlan];
                if (tmpPlan.plan_name == tmpdata.plan_name) {
                    //PLAN nya ketemu maka format benefit
                    tmpbenefit.benefit_limit = "";
                    if (tmpPlan.limit1Type == "99" || tmpPlan.limit2Type == "99") {
                        tmpbenefit.benefit_limit = "Not Available";
                    } else {
                        if (tmpbenefit.unit == "2" && Boolean(tmpPlan.unit_price_limit)) {
                            tmpbenefit.benefit_limit += "LIMIT PER " + tmpbenefit.unit_name + " = Rp. " + apihelper.formatThousandGroup(tmpPlan.unit_price_limit) + "\r\n";
                        }


                        var telahAdaUnlimited = false;
                        var limit1 = satuan_limit_data.find(s => s.key == tmpPlan.limit1Type);

                        if (Boolean(limit1)) {
                            if (limit1.valueType == config.limit_value_type.AsClaim) {
                                telahAdaUnlimited = true;
                            } else {
                                tmpbenefit.benefit_limit += apihelper.formatThousandGroup(tmpPlan.limit1) + " " + apihelper.formatUnitName(limit1.valueType, limit1.durationType, tmpbenefit.unit_name) + "\r\n";
                            }
                        }

                        var limit2 = satuan_limit_data.find(s => s.key == tmpPlan.limit2Type);
                        if (Boolean(limit2)) {
                            if (limit2.valueType == config.limit_value_type.AsClaim) {

                            } else {
                                tmpbenefit.benefit_limit += apihelper.formatThousandGroup(tmpPlan.limit2) + " " + apihelper.formatUnitName(limit2.valueType, limit2.durationType, tmpbenefit.unit_name) + "\r\n";
                            }
                        }



                    }
                    // tmpbenefit.limit1 = tmpPlan.limit1;
                    // tmpbenefit.limit2 = tmpPlan.limit2;
                    // tmpbenefit.unit_price_limit = tmpPlan.unit_price_limit;
                    // tmpbenefit.limit1Type = tmpPlan.limit1Type;
                    // tmpbenefit.limit2Type = tmpPlan.limit2Type;
                    break;
                }
            }
            tmpbenefit.unit_name = undefined;
            tmpbenefit.unit = undefined;
            tmpbenefit.plan = undefined;
        }

        tmpdata.product = undefined;
        return apihelper.APIResponseOK(res, true, "", tmpdata);
    }

    return apihelper.APIResponseOK(res, true, "", null);


}))


// Digital Form 
router.post("/digital_form/create", authM, apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;
    var head = req.headers;
    var submit = {};
    var saveData = {};
    var user = req.user;
    var fstream;
    var imagesToUpload = [];
    var imageToAdd = {};
    var attachmentToUpload = [];
    var attachmentToAdd = {};
    var detailForm = {};

    var userData = await User.findOne({ _id: user }, "_id nama handphone email nik userId company").exec();
    var company = await Company.findOne({ _id: userData.company }, "_id name").exec();
    var cdate = moment().utc().format('YYYY-MM');
    var counter = await Counter.findOneAndUpdate({ counter_name: config.const.COUNTER_NAME_CLAIM },
        [{ $addFields: { last_retrieve_date: cdate, value: { $cond: [{ $eq: ["$last_retrieve_date", cdate] }, { $add: ["$value", 1] }, 1] } } }]);

    req.pipe(req.busboy)

    req.busboy.on('field', (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
        submit[fieldname] = val;
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        var docType;

        switch (fieldname) {
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
            case "DOKUMEN_PENUNJANG_LAINNYA":
                docType = "OTHERS";
                break;
        }

        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp' || ext == '.jfif')) {
            return apiHelper.APIResponseBR(res, false, "Jenis File Yang di upload tidak valid", null);
        }

        var fileAbsPath = `/digital_form_document/${user._id}/`;
        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }
        var fileName = `${docType}_` + user._id + strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath + fileName);
        file.pipe(fstream);
        imageToAdd = {
            _id: mongoose.Types.ObjectId(),
            name: filename,
            mimetype: mimetype,
            path: fileAbsPath + fileName,
            type: docType
        }

        attachmentToAdd = {
            filename: docType + ext,
            path: config.uploadTempPath + fileAbsPath + fileName
        }

        imagesToUpload.push(imageToAdd);
        attachmentToUpload.push(attachmentToAdd);
    });

    req.busboy.on('finish', () => {

        if (apiHelper.isEmptyObj(submit.form_type))
            return apiHelper.APIResponseBR(res, false, "Silahkan input jenis form", undefined);

        if (apiHelper.isEmptyObj(submit.form_certificate_no))
            return apiHelper.APIResponseBR(res, false, "Nomor Sertifikat Tidak Valid", undefined);

        if (apiHelper.isEmptyObj(submit.form_participant_name))
            return apiHelper.APIResponseBR(res, false, "Silahkan input nama peserta", undefined);

        if (apiHelper.isEmptyObj(submit.form_participant_phone_number))
            return apiHelper.APIResponseBR(res, false, "Silahkan input nomor telepon perserta", undefined);

        if (apiHelper.isEmptyObj(submit.form_participant_email))
            return apiHelper.APIResponseBR(res, false, "Silahkan input alamat email peserta", undefined);

        if (apiHelper.isEmptyObj(submit.form_identity_card_no))
            return apiHelper.APIResponseBR(res, false, "Silahkan input NIK Peserta", undefined);

        if (submit.form_identity_card_no.length != 16) {
            return apiHelper.APIResponseBR(res, false, "NIK Yang di input tidak valid", undefined);
        }

        if (apiHelper.isEmptyObj(submit.form_participant_hospital))
            return apiHelper.APIResponseBR(res, false, "Silahkan input id rumah sakit yang dikunjungi peserta", undefined);

        if (apiHelper.isEmptyObj(submit.form_participant_hospital_name))
            return apiHelper.APIResponseBR(res, false, "Silahkan input nama rumah sakit yang dikunjungi peserta", undefined);

        if (apiHelper.isEmptyObj(submit.form_reason_submit))
            return apiHelper.APIResponseBR(res, false, "Silahkan input alasan pengobatan", undefined);

        if (apiHelper.isEmptyObj(submit.form_reporter))
            return apiHelper.APIResponseBR(res, false, "Silahkan input apakah anda peserta atau wali pelapor ", undefined);

        if (apiHelper.isEmptyObj(submit.form_submit_signature))
            return apiHelper.APIResponseBR(res, false, "Silahkan input nama orang yang mengajukan form.", undefined);


        var company_affliation = ""
        if (apiHelper.isEmptyObj(company)) {
            company_affliation = "-"
        }
        company_affliation = company.name

        var formType = ""
        switch (submit.form_type) {
            case "1":
                formType = config.jenis_form.CASHLESS;
                break;
            default:
                formType = config.jenis_form.REIMBURSE;
                submit.form_is_doc_attached = false;
        }

        var date = moment().format("MM/YYYY")
        var realDate = date.replaceAll("/", "")
        var randNoClaim = strHelper.generateRandomNumber(5)
        var randNoSubmit = strHelper.generateRandomNumber(5)

        saveData.form_submit_no = "SBM" + realDate + randNoSubmit
        saveData.form_claim_no = ("CLM" + apiHelper.getMonthYear() + apiHelper.paddingZero(counter.value, 5))
        saveData.form_type = formType
        saveData.form_status = config.status_form.PENDING
        saveData.form_participant_name = submit.form_participant_name
        saveData.form_participant_phone_number = submit.form_participant_phone_number
        saveData.form_participant_email = submit.form_participant_email
        saveData.form_identity_card_no = submit.form_identity_card_no
        saveData.form_participant_user_id = userData.userId
        saveData.form_reason_submit = submit.form_reason_submit
        saveData.form_reporter = submit.form_reporter
        saveData.form_submit_signature = submit.form_submit_signature
        saveData.form_certificate_no = submit.form_certificate_no
        saveData.form_company_affliation = userData.company
        saveData.form_user_submit = user
        saveData.form_participant_hospital = submit.form_participant_hospital

        detailForm.form_number = saveData.form_submit_no;
        detailForm.form_claim_number = saveData.form_claim_no;


        switch (submit.form_reason_submit) {
            case "KECELAKAAN":
                saveData.form_reason_incident_detail = {
                    incident_no_sim: submit.incident_no_sim,
                    incident_location: submit.incident_location,
                    incident_date: submit.incident_date,
                    incident_hour: submit.incident_hour,
                    incident_chronogical: submit.incident_chronogical,
                    incident_cause: submit.incident_cause,
                    incident_body_part_injured: submit.incident_body_part_injured
                }
                break;
            case "SAKIT":
                saveData.form_reason_sick_detail = {
                    sick_recognized_at: submit.sick_recognized_at,
                    sick_chronogical: submit.sick_chronogical
                }
                break;
        }

        switch (submit.form_reporter) {
            case "WALI":
                saveData.form_reporter_detail = {
                    reporter_name: submit.reporter_name,
                    reporter_nik: submit.reporter_nik,
                    reporter_phone_number: submit.reporter_phone_number,
                    reporter_email: submit.reporter_email,
                    reporter_relation: submit.reporter_relation,
                    reporter_address: submit.reporter_address
                }
                break;
            case "PESERTA":
                break;
        }

        switch (formType) {
            case config.jenis_form.REIMBURSE:
                saveData.form_participant_bank_acc = {
                    bank_name: submit.bank_name,
                    bank_acc_name: submit.bank_acc_name,
                    bank_acc_number: submit.bank_acc_number
                }
                break;
            case config.jenis_form.REIMBURSE:
                break;
        }

        saveData.form_attachement = imagesToUpload;
        saveData.created_at = moment().utc().toDate()
        saveData.updated_at = moment().utc().toDate()

        switch (submit.form_type) {
            case "1":
                switch (submit.form_reason_submit) {
                    case "KECELAKAAN":
                        switch (submit.form_reporter) {
                            case "WALI":
                                var template = fs.readFileSync('./html/Form_Digital/Cashless/Kecelakaan/FormCashless_Kecelakaan_Wali.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#incident_location#", submit.incident_location);
                                template = template.replaceAll("#incident_date#", submit.incident_date);
                                template = template.replaceAll("#incident_hour#", submit.incident_hour);
                                template = template.replaceAll("#incident_chronogical#", submit.incident_chronogical);
                                template = template.replaceAll("#incident_cause#", submit.incident_cause);
                                template = template.replaceAll("#incident_body_part_injured#", submit.incident_body_part_injured);
                                template = template.replaceAll("#reporter_name#", submit.reporter_name);
                                template = template.replaceAll("#reporter_nik#", submit.reporter_nik);
                                template = template.replaceAll("#reporter_phone_number#", submit.reporter_phone_number);
                                template = template.replaceAll("#reporter_email#", submit.reporter_email);
                                template = template.replaceAll("#reporter_relation#", submit.reporter_relation);
                                template = template.replaceAll("#reporter_address#", submit.reporter_address);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Cashless - Salvus Health"
                                apiHelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                            case "PESERTA":
                                var template = fs.readFileSync('./html/Form_Digital/Cashless/Kecelakaan/FormCashless_Kecelakaan_Pelapor.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#incident_location#", submit.incident_location);
                                template = template.replaceAll("#incident_date#", submit.incident_date);
                                template = template.replaceAll("#incident_hour#", submit.incident_hour);
                                template = template.replaceAll("#incident_chronogical#", submit.incident_chronogical);
                                template = template.replaceAll("#incident_cause#", submit.incident_cause);
                                template = template.replaceAll("#incident_body_part_injured#", submit.incident_body_part_injured);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Cashless - Salvus Health"
                                var resultEmail = apihelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                        }
                        break;
                    case "SAKIT":
                        switch (submit.form_reporter) {
                            case "WALI":
                                var template = fs.readFileSync('./html/Form_Digital/Cashless/Sakit/FormCashless_Sakit_Wali.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#sick_date#", submit.sick_recognized_at);
                                template = template.replaceAll("#sick_chronogical#", submit.sick_chronogical);
                                template = template.replaceAll("#reporter_name#", submit.reporter_name);
                                template = template.replaceAll("#reporter_nik#", submit.reporter_nik);
                                template = template.replaceAll("#reporter_phone_number#", submit.reporter_phone_number);
                                template = template.replaceAll("#reporter_email#", submit.reporter_email);
                                template = template.replaceAll("#reporter_relation#", submit.reporter_relation);
                                template = template.replaceAll("#reporter_address#", submit.reporter_address);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Cashless - Salvus Health"
                                var resultEmail = apihelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                            case "PESERTA":
                                var template = fs.readFileSync('./html/Form_Digital/Cashless/Sakit/FormCashless_Sakit_Pelapor.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#sick_date#", submit.sick_recognized_at);
                                template = template.replaceAll("#sick_chronogical#", submit.sick_chronogical);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Cashless - Salvus Health"
                                var resultEmail = apihelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                        }
                        break;
                }
                break;
            case "2":
                switch (submit.form_reason_submit) {
                    case "KECELAKAAN":
                        switch (submit.form_reporter) {
                            case "WALI":

                                var template = fs.readFileSync('./html/Form_Digital/Reimburse/Kecelakaan/FormReimburse_Kecelakaan_Wali.html', 'utf8')
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#incident_location#", submit.incident_location);
                                template = template.replaceAll("#incident_date#", submit.incident_date);
                                template = template.replaceAll("#incident_hour#", submit.incident_hour);
                                template = template.replaceAll("#incident_chronogical#", submit.incident_chronogical);
                                template = template.replaceAll("#incident_cause#", submit.incident_cause);
                                template = template.replaceAll("#incident_body_part_injured#", submit.incident_body_part_injured);
                                template = template.replaceAll("#bank_name#", submit.bank_name);
                                template = template.replaceAll("#bank_acc_name#", submit.bank_acc_name);
                                template = template.replaceAll("#bank_acc_no#", submit.bank_acc_number);
                                template = template.replaceAll("#reporter_name#", submit.reporter_name);
                                template = template.replaceAll("#reporter_nik#", submit.reporter_nik);
                                template = template.replaceAll("#reporter_phone_number#", submit.reporter_phone_number);
                                template = template.replaceAll("#reporter_email#", submit.reporter_email);
                                template = template.replaceAll("#reporter_relation#", submit.reporter_relation);
                                template = template.replaceAll("#reporter_address#", submit.reporter_address);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Reimburse - Salvus Health"
                                apiHelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                            case "PESERTA":
                                var template = fs.readFileSync('./html/Form_Digital/Reimburse/Kecelakaan/FormReimburse_Kecelakaan_Pelapor.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#incident_location#", submit.incident_location);
                                template = template.replaceAll("#incident_date#", submit.incident_date);
                                template = template.replaceAll("#incident_hour#", submit.incident_hour);
                                template = template.replaceAll("#incident_chronogical#", submit.incident_chronogical);
                                template = template.replaceAll("#incident_cause#", submit.incident_cause);
                                template = template.replaceAll("#incident_body_part_injured#", submit.incident_body_part_injured);
                                template = template.replaceAll("#bank_name#", submit.bank_name);
                                template = template.replaceAll("#bank_acc_name#", submit.bank_acc_name);
                                template = template.replaceAll("#bank_acc_no#", submit.bank_acc_number);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Reimburse - Salvus Health"
                                apiHelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                        }
                        break;
                    case "SAKIT":
                        switch (submit.form_reporter) {
                            case "WALI":
                                var template = fs.readFileSync('./html/Form_Digital/Reimburse/Sakit/FormReimburse_Sakit_Wali.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#sick_date#", submit.sick_recognized_at);
                                template = template.replaceAll("#sick_chronogical#", submit.sick_chronogical);
                                template = template.replaceAll("#bank_name#", submit.bank_name);
                                template = template.replaceAll("#bank_acc_name#", submit.bank_acc_name);
                                template = template.replaceAll("#bank_acc_no#", submit.bank_acc_number);
                                template = template.replaceAll("#reporter_name#", submit.reporter_name);
                                template = template.replaceAll("#reporter_nik#", submit.reporter_nik);
                                template = template.replaceAll("#reporter_phone_number#", submit.reporter_phone_number);
                                template = template.replaceAll("#reporter_email#", submit.reporter_email);
                                template = template.replaceAll("#reporter_relation#", submit.reporter_relation);
                                template = template.replaceAll("#reporter_address#", submit.reporter_address);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Reimburse - Salvus Health"
                                apiHelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                            case "PESERTA":
                                var template = fs.readFileSync('./html/Form_Digital/Reimburse/Sakit/FormReimburse_Sakit_Pelapor.html', 'utf8');
                                template = template.replaceAll("#participant_name#", submit.form_participant_name);
                                template = template.replaceAll("#rumah_sakit#", submit.form_participant_hospital_name);
                                template = template.replaceAll("#tanggal_form#", moment().format("DD/MM/YYYY"));
                                template = template.replaceAll("#perusahaan_afliasi#", company_affliation);
                                template = template.replaceAll("#participant_phone_number#", submit.form_participant_phone_number);
                                template = template.replaceAll("#participant_email#", submit.form_participant_email);
                                template = template.replaceAll("#participant_identity_card_no#", submit.form_identity_card_no);
                                template = template.replaceAll("#participant_user_id#", submit.form_participant_user_id);
                                template = template.replaceAll("#no_sim#", submit.incident_no_sim);
                                template = template.replaceAll("#sick_date#", submit.sick_recognized_at);
                                template = template.replaceAll("#sick_chronogical#", submit.sick_chronogical);
                                template = template.replaceAll("#bank_name#", submit.bank_name);
                                template = template.replaceAll("#bank_acc_name#", submit.bank_acc_name);
                                template = template.replaceAll("#bank_acc_no#", submit.bank_acc_number);
                                template = template.replaceAll("#submit_signature#", submit.form_submit_signature);

                                var emailSubject = "Bukti Pengajuan Klaim Reimburse - Salvus Health"
                                apiHelper.sendEmailNocc(submit.form_participant_email, emailSubject, template, attachmentToUpload);
                                break;
                        }
                        break;
                }
                break;
        }

        var result = DigitalForm.create(saveData);


        if (result) {
            return apiHelper.APIResponseOK(res, true, "Submit Digital Form Telah Berhasil !.", detailForm);
        }
        else {
            return apiHelper.APIResponseErr(res, false, "Tidak Dapat Membuat Digital Form, Silahkan Coba lagi", undefined);
        }
    });

}))

// List Bank
router.get("/list_bank", authM, apiHelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ Name: q });
        finalQuery["$or"].push({ Code: q });
    }

    var result = ListBank.paginate(finalQuery, {
        select:
            `
        _id
        Name
        Code`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data.docs);
    });
}))

router.get("/list_bank/web", authM, apiHelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ Name: q });
        finalQuery["$or"].push({ Code: q });
    }

    var result = ListBank.paginate(finalQuery, {
        select:
            `
        _id
        Name
        Code`,
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apiHelper.APIResponseOK(res, true, undefined, data);
    });
}))

//########## VOUCHER ################

router.get("/shop/category/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var result1 = await ProductCategory.find({}, "name description image is_active").lean().exec()
    
    return apihelper.APIResponseOK(res, true, "Berhasil mendapatkan list category", result1);
}))


router.get("/shop/voucher/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        category: ObjectID(category)
    };



    var sort = { 'provider_data.name': 1 };

    if (sb == "1") {
        sort = { 'provider_data.name': 1 };
    } else if (sb == "2") {
        sort = { 'provider_data.name': -1 };
    } else if (sb == "3") {
        sort = { 'price': 1 };
    } else if (sb == "4") {
        sort = { 'price': -1 };
    }

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filter["$or"] = [];
        filter["$or"].push({ "name": q });
        filter["$or"].push({ "provider_data.name": q });
        filter["$or"].push({ "description": q });
    }


    var result = await Voucher.aggregate([
        {
            $lookup: {
                from: "hospital",
                localField: "provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        { $match: filter },


        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'name': 1, 'provider_data.name': 1, 'provider_data.type': 1, 'provider_type.asset': 1, 'provider_type.name': 1, 'short_description': 1, 'paket_days': 1, 'limit_days': 1, 'price': 1, 'syarat_ketentuan': 1, 'packet_days': 1, 'category': 1
            }
        },
        {
            $sort: sort
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
        return apihelper.APIResponseOK(res, true, "", result[0].docs);
    } else {
        return apihelper.APIResponseOK(res, true, "", undefined);
    }

}))

router.get("/shop/voucher/list/web", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        category: ObjectID(category)
    };



    var sort = { 'provider_data.name': 1 };

    if (sb == "1") {
        sort = { 'provider_data.name': 1 };
    } else if (sb == "2") {
        sort = { 'provider_data.name': -1 };
    } else if (sb == "3") {
        sort = { 'price': 1 };
    } else if (sb == "4") {
        sort = { 'price': -1 };
    }

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filter["$or"] = [];
        filter["$or"].push({ "name": q });
        filter["$or"].push({ "provider_data.name": q });
        filter["$or"].push({ "description": q });
    }


    var result = await Voucher.aggregate([
        {
            $lookup: {
                from: "hospital",
                localField: "provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        { $match: filter },


        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'name': 1, 'provider_data.name': 1, 'provider_data.type': 1, 'provider_type.asset': 1, 'provider_type.name': 1, 'short_description': 1, 'paket_days': 1, 'limit_days': 1, 'price': 1, 'syarat_ketentuan': 1, 'packet_days': 1, 'category': 1
            }
        },
        {
            $sort: sort
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




router.get("/shop/myOrder/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        user: ObjectID(req.userId)
    };

    var sort = { 'created_at': -1 };

    if (sb == "1") {
        sort = { 'created_at': -1 };
    } else if (sb == "2") {
        sort = { 'created_at': 1 };
    } else if (sb == "3") {
        sort = { 'voucher_data.name': 1 };
    } else if (sb == "4") {
        sort = { 'voucher_data.name': -1 };
    }

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filter["$or"] = [];
        filter["$or"].push({ "transaction_no": q });
        filter["$or"].push({ "voucher_data.name": q });
        filter["$or"].push({ "provider_data.name": q });
        filter["$or"].push({ "voucher_data.description": q });
    }


    var result = await OrderTransaction.aggregate([
        { $addFields: { voucher: { $arrayElemAt: ['$items', 0] } } },
        {
            $lookup: {
                from: "voucher",
                localField: "voucher.voucher",
                foreignField: "_id",
                as: "voucher_data"
            }
        },
        {
            $unwind: {
                "path": "$voucher_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "hospital",
                localField: "voucher_data.provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        { $match: filter },


        {
            $lookup: {
                from: "payment_method",
                localField: "payment_type",
                foreignField: "method_id",
                as: "payment_method"
            }
        },
        {
            $unwind: {
                "path": "$payment_method",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "OrderTransactionStatus",
                localField: "status",
                foreignField: "code",
                as: "orderStatus"
            }
        },
        {
            $unwind: {
                "path": "$orderStatus",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'provider_data.name': 1, 'provider_data.type': 1, 'provider_type.asset': 1, 'provider_type.name': 1, 'voucher_data.name': 1,
                'voucher_data.short_description': 1, 'voucher_data.packet_days': 1, 'voucher_data.limit_days': 1, 'voucher_data.price': 1,
                'voucher.quantity': 1, 'payment_method': 1, 'expired_at': 1, 'user_confirm_payment_image': 1, 'created_at': 1,
                'subtotal': 1, 'transaction_fee': 1, 'grant_total': 1, 'transaction_no': 1, 'subtotal': 1, ' ': 1, 'status': 1, 'payment_type': 1,
                'orderStatus.description': 1, 'virtual_account': 1, 'e_wallet': 1
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
        return apihelper.APIResponseOK(res, true, "", result[0].docs);
    } else {
        return apihelper.APIResponseOK(res, true, "", undefined);
    }

}))

router.get("/shop/myOrder/list/web", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        user: ObjectID(req.userId)
    };

    var sort = { 'created_at': -1 };

    if (sb == "1") {
        sort = { 'created_at': 1 };
    } else if (sb == "2") {
        sort = { 'created_at': -1 };
    } else if (sb == "3") {
        sort = { 'voucher_data.name': 1 };
    } else if (sb == "4") {
        sort = { 'voucher_data.name': -1 };
    }

    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filter["$or"] = [];
        filter["$or"].push({ "transaction_no": q });
        filter["$or"].push({ "voucher_data.name": q });
        filter["$or"].push({ "provider_data.name": q });
        filter["$or"].push({ "voucher_data.description": q });
    }


    var result = await OrderTransaction.aggregate([
        { $addFields: { voucher: { $arrayElemAt: ['$items', 0] } } },
        {
            $lookup: {
                from: "voucher",
                localField: "voucher.voucher",
                foreignField: "_id",
                as: "voucher_data"
            }
        },
        {
            $unwind: {
                "path": "$voucher_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "hospital",
                localField: "voucher_data.provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        { $match: filter },


        {
            $lookup: {
                from: "payment_method",
                localField: "payment_type",
                foreignField: "method_id",
                as: "payment_method"
            }
        },
        {
            $unwind: {
                "path": "$payment_method",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "OrderTransactionStatus",
                localField: "status",
                foreignField: "code",
                as: "orderStatus"
            }
        },
        {
            $unwind: {
                "path": "$orderStatus",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'provider_data.name': 1, 'provider_data.type': 1, 'provider_type.asset': 1, 'provider_type.name': 1, 'voucher_data.name': 1,
                'voucher_data.short_description': 1, 'voucher_data.packet_days': 1, 'voucher_data.limit_days': 1, 'voucher_data.price': 1,
                'voucher.quantity': 1, 'payment_method': 1, 'expired_at': 1, 'user_confirm_payment_image': 1, 'created_at': 1,
                'subtotal': 1, 'transaction_fee': 1, 'grant_total': 1, 'transaction_no': 1, 'subtotal': 1, ' ': 1, 'status': 1, 'payment_type': 1,
                'orderStatus.description': 1, 'virtual_account': 1, 'e_wallet': 1
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


router.get("/shop/voucher/detail/:id", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var dataId = new ObjectID(req.params.id);

    var filter = { _id: dataId };

    var result = await Voucher.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "hospital",
                localField: "provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'name': 1, 'short_description': 1, 'description': 1, 'cara_pakai': 1, 'limit_days': 1, 'price': 1, 'syarat_ketentuan': 1, 'packet_days': 1, 'end_date': 1,
                'provider_data.name': 1, 'provider_data.address': 1, 'provider_data.phone1': 1, 'provider_data.longitude': 1, 'provider_data.latitude': 1, 'provider_data.address_complete': 1

            }
        }
    ]).exec();


    var endDateLimitDay = null;
    if (result[0].limit_days) {
        endDateLimitDay = moment().utc().startOf('day').add(result[0].limit_days, 'days').toDate();
    }

    if (Boolean(result[0].end_date)) {
        if (moment(result[0].end_date).isAfter(endDateLimitDay)) {
            result[0].end_day_final = endDateLimitDay;
        } else {
            result[0].end_day_final = moment(result[0].end_date);
        }
    } else {
        result[0].end_day_final = endDateLimitDay;
    }




    if (result != null && result.length > 0) {
        return apihelper.APIResponseOK(res, true, "", result[0]);
    } else {
        return apihelper.APIResponseOK(res, true, "", undefined);
    }

}))


router.post("/shop/notify_paid", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;
    var dataOrder = await OrderTransaction.findById({ _id: ObjectID(data.transaction_id) }).exec();

    if (dataOrder != null) {
        if (dataOrder.status != config.transaction_status.WAITING_PAYMENT && dataOrder.status != config.transaction_status.REJECT_PAYMENT)
            return apihelper.APIResponseOK(res, false, "Transaksi telah berhasil di konfirmasi bayar sebelumnya, Silahkan refresh", undefined);

        if (apihelper.isEmptyObj(dataOrder.user_confirm_payment_image))
            return apihelper.APIResponseOK(res, false, "Silahkan upload gambar bukti pembayaran terlebih dahulu.", undefined);


        var result = await OrderTransaction.findByIdAndUpdate({ _id: data.transaction_id }, {
            status: config.transaction_status.PAID,
            user_confirm_payment_date: moment().utc().toDate(),
            updated_by: req.user,
            updated_at: moment().utc().toDate()
        }).exec();
        return apihelper.APIResponseOK(res, true, undefined, undefined);

    } else
        return apihelper.APIResponseOK(res, false, "data tidak di temukan", result1);

}))

router.post("/shop/notify_paid/image", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query;
    var transaction_id = "";
    var fileAbsPath = "";

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('error', (err) => {
        debugLog(options, `Busboy error`);
        next(err);
        return apihelper.APIResponseErr(res, false, err, null);
    });

    req.busboy.on('field', (fieldname, value) => {
        if (fieldname === "transaction_id")
            transaction_id = value
    });

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp')) {
            return apihelper.APIResponseErr(res, false, "Gunakan file format jpg, jpeg, png atau bmp", null);
        }


        var fileName = strHelper.generateRandom(120) + ext;
        fileAbsPath = `/order/confirmpayment/`;

        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }

        fileAbsPath = fileAbsPath + fileName;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath);

        file.pipe(fstream);
        file.on('limit', function () {
            fs.unlink(path, function () {
                limit_reach = true;
                res.status(455).send(limit_reach_err);
            });
        });

        fstream.on('close', function () {
            console.log("Upload Finished of " + filename);
        });
    });

    req.busboy.on('finish', async () => {
        if (apihelper.isEmptyObj(fileAbsPath) || apihelper.isEmptyObj(transaction_id))
            return apihelper.APIResponseOK(res, false, "Silahkan isi transaction no dan Image", null);

        var dataOrder = await OrderTransaction.findById({ _id: ObjectID(transaction_id) }).exec();

        if (dataOrder.status != config.transaction_status.WAITING_PAYMENT && dataOrder.status != config.transaction_status.REJECT_PAYMENT)
            return apihelper.APIResponseOK(res, false, "Transaksi telah berhasil di konfirmasi bayar sebelumnya, Silahkan refresh", undefined);

        updateres = await OrderTransaction.update({ _id: ObjectID(transaction_id), __v: dataOrder.__v }, {
            user_confirm_payment_image: fileAbsPath
        });

        if (updateres.nModified == 1) {
            return apihelper.APIResponseOK(res, true, "", {
                image: fileAbsPath
            });
        } else {
            return apihelper.APIResponseOK(res, false, "Tidak dapat mengupdate data order, Silahkan coba kembali", undefined);

        }

    });

}))

router.post("/shop/notify_paid/image/web/:id", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query;
    var transaction_id = req.params.id
    var fileAbsPath = "";

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('error', (err) => {
        debugLog(options, `Busboy error`);
        next(err);
        return apihelper.APIResponseErr(res, false, err, null);
    });


    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp')) {
            return apihelper.APIResponseErr(res, false, "Gunakan file format jpg, jpeg, png atau bmp", null);
        }


        var fileName = strHelper.generateRandom(120) + ext;
        fileAbsPath = `/order/confirmpayment/`;

        if (!fs.existsSync(config.uploadTempPath + fileAbsPath)) {
            fs.mkdirSync(config.uploadTempPath + fileAbsPath);
        }

        fileAbsPath = fileAbsPath + fileName;
        fstream = fs.createWriteStream(config.uploadTempPath + fileAbsPath);

        file.pipe(fstream);
        file.on('limit', function () {
            fs.unlink(path, function () {
                limit_reach = true;
                res.status(455).send(limit_reach_err);
            });
        });

        fstream.on('close', function () {
            console.log("Upload Finished of " + filename);
        });
    });

    req.busboy.on('finish', async () => {
        if (apihelper.isEmptyObj(fileAbsPath) || apihelper.isEmptyObj(transaction_id))
            return apihelper.APIResponseOK(res, false, "Silahkan isi transaction no dan Image", null);

        var dataOrder = await OrderTransaction.findById({ _id: ObjectID(transaction_id) }).exec();

        if (dataOrder.status != config.transaction_status.WAITING_PAYMENT && dataOrder.status != config.transaction_status.REJECT_PAYMENT)
            return apihelper.APIResponseOK(res, false, "Transaksi telah berhasil di konfirmasi bayar sebelumnya, Silahkan refresh", undefined);

        updateres = await OrderTransaction.update({ _id: ObjectID(transaction_id), __v: dataOrder.__v }, {
            user_confirm_payment_image: fileAbsPath
        });

        if (updateres.nModified == 1) {
            return apihelper.APIResponseOK(res, true, "", {
                image: fileAbsPath
            });
        } else {
            return apihelper.APIResponseOK(res, false, "Tidak dapat mengupdate data order, Silahkan coba kembali", undefined);

        }

    });

}))

router.get("/wallet/list", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        user: ObjectID(req.userId)
    };

    var filterAdd = {
    };

    var sort = { 'status': 1, 'provider_data.name': 1 };

    if (sb == "1") {
        sort = { 'status': 1, 'provider_data.name': 1 };
    } else if (sb == "2") {
        sort = { 'status': 1, 'provider_data.name': -1 };
    } else if (sb == "3") {
        sort = { 'status': 1, 'purchase_date': -1 };
    } else if (sb == "4") {
        sort = { 'status': 1, 'purchase_date': 1 };
    }



    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filterAdd["$or"] = [];
        filterAdd["$or"].push({ "voucher_code": q });
        filterAdd["$or"].push({ "transaction_data.transaction_no": q });
        filterAdd["$or"].push({ "name": q });
        filterAdd["$or"].push({ "provider_data.name": q });
        filterAdd["$or"].push({ "voucher_data.description": q });
        filterAdd["$or"].push({ "voucher_data.short_description": q });
    }


    var result = await VoucherWallet.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "purchase_transaction_id",
                foreignField: "_id",
                as: "transaction_data"
            }
        },
        {
            $unwind: {
                "path": "$transaction_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "voucher",
                localField: "voucher",
                foreignField: "_id",
                as: "voucher_data"
            }
        },
        {
            $unwind: {
                "path": "$voucher_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "hospital",
                localField: "voucher_data.provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        { $match: filterAdd },

        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'is_membership':1,'voucher_code': 1, 'expired_date': 1, 'purchase_date': 1, 'transaction_data.transaction_no': 1, 'status': 1,
                'voucher_data': { 'name': 1, 'short_description': 1, 'description': 1, 'packet_days': 1, 'limit_days': 1, 'price': 1, 'end_date': 1 },
                'provider_data': { 'name': 1, 'type': 1 },
                'provider_type': { 'name': 1, 'asset': 1 }
            }
        },
        {
            $sort: sort
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
        return apihelper.APIResponseOK(res, true, "", result[0].docs);
    } else {
        return apihelper.APIResponseOK(res, true, "", undefined);
    }

}))

router.get("/wallet/list/web", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, search, status, sb, sd, category } = req.query;

    var filter = {
        user: ObjectID(req.userId)
    };

    var filterAdd = {
    };

    var sort = { 'status': 1, 'provider_data.name': 1 };

    if (sb == "1") {
        sort = { 'status': 1, 'provider_data.name': 1 };
    } else if (sb == "2") {
        sort = { 'status': 1, 'provider_data.name': -1 };
    } else if (sb == "3") {
        sort = { 'status': 1, 'purchase_date': -1 };
    } else if (sb == "4") {
        sort = { 'status': 1, 'purchase_date': 1 };
    }



    if (req.query.search) {
        var q = new RegExp(req.query.search, 'i');
        filterAdd["$or"] = [];
        filterAdd["$or"].push({ "voucher_code": q });
        filterAdd["$or"].push({ "transaction_data.transaction_no": q });
        filterAdd["$or"].push({ "name": q });
        filterAdd["$or"].push({ "provider_data.name": q });
        filterAdd["$or"].push({ "voucher_data.description": q });
        filterAdd["$or"].push({ "voucher_data.short_description": q });
    }


    var result = await VoucherWallet.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "purchase_transaction_id",
                foreignField: "_id",
                as: "transaction_data"
            }
        },
        {
            $unwind: {
                "path": "$transaction_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "voucher",
                localField: "voucher",
                foreignField: "_id",
                as: "voucher_data"
            }
        },
        {
            $unwind: {
                "path": "$voucher_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "hospital",
                localField: "voucher_data.provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        { $match: filterAdd },

        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'is_membership':1, 'voucher_code': 1, 'expired_date': 1, 'purchase_date': 1, 'transaction_data.transaction_no': 1, 'status': 1,
                'voucher_data': { 'name': 1, 'short_description': 1, 'description': 1, 'packet_days': 1, 'limit_days': 1, 'price': 1, 'end_date': 1 },
                'provider_data': { 'name': 1, 'type': 1 },
                'provider_type': { 'name': 1, 'asset': 1 }
            }
        },
        {
            $sort: sort
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

router.get("/wallet/detail/:id", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var dataId = new ObjectID(req.params.id);
    var data = req.body;

    var filter = {
        _id: dataId
    };

    var result = await VoucherWallet.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "purchase_transaction_id",
                foreignField: "_id",
                as: "transaction_data"
            }
        },
        {
            $unwind: {
                "path": "$transaction_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "voucher",
                localField: "voucher",
                foreignField: "_id",
                as: "voucher_data"
            }
        },
        {
            $unwind: {
                "path": "$voucher_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $lookup: {
                from: "hospital",
                localField: "voucher_data.provider",
                foreignField: "_id",
                as: "provider_data"
            }
        },
        {
            $unwind: {
                "path": "$provider_data",
                "preserveNullAndEmptyArrays": true
            }
        },

        {
            $lookup: {
                from: "provider_type",
                localField: "provider_data.type",
                foreignField: "type",
                as: "provider_type"
            }
        },
        {
            $unwind: {
                "path": "$provider_type",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'voucher_code': 1, 'expired_date': 1, 'purchase_date': 1, 'transaction_data.transaction_no': 1, 'status': 1, 'used_date': 1,
                'voucher_data': { 'name': 1, 'short_description': 1, 'description': 1, 'packet_days': 1, 'limit_days': 1, 'price': 1, 'end_date': 1 },
                'provider_data': { 'name': 1, 'type': 1, 'address': 1, 'address_complete': 1, 'zip_code': 1, 'phone1': 1 },
                'provider_type': { 'name': 1, 'asset': 1 }
            }
        }
    ]).exec();



    if (result != null && result.length > 0) {
        return apihelper.APIResponseOK(res, true, "", result[0]);
    } else {
        return apihelper.APIResponseOK(res, false, "", undefined);
    }

}))


router.post("/wallet/usevoucher/:id", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var dataId = new ObjectID(req.params.id);
    var data = req.body;

    var filter = {
        _id: dataId
    };

    if (apihelper.isEmptyObj(data.pin) || data.pin.length < 6) {
        return apihelper.APIResponseOK(res, false, "Silahkan input PIN", undefined);
    }

    var dataWallet = await VoucherWallet.findOne({ _id: dataId }).lean().exec();
    if (apihelper.isEmptyObj(dataWallet)) {
        return apihelper.APIResponseOK(res, false, "Data tidak ditemukan", undefined);
    }

    if (dataWallet.status !== config.voucher_wallet_status.NEW) {
        return apihelper.APIResponseOK(res, false, "Voucher status invalid", undefined);
    }

    var dataProvider = await Hospital.findById({ _id: dataWallet.provider }).exec();
    if (apihelper.isEmptyObj(dataProvider)) {
        return apihelper.APIResponseOK(res, false, "Data provider tidak ditemukan", undefined);
    }

    if (apihelper.isEmptyObj(dataProvider.voucher_pin)) {
        return apihelper.APIResponseOK(res, false, "Provider PIN di setup, silahkan hubungi Administrator Salute", undefined);
    }

    if (dataProvider.voucher_pin == data.pin) {
        var updateres = await VoucherWallet.update({ _id: dataId, __v: dataWallet.__v }, {
            used_date: moment().utc().toDate(),
            status: config.voucher_wallet_status.USED
        });

        if (updateres.nModified == 1) {
            return apihelper.APIResponseOK(res, true, "Voucher berhasil di gunakan", undefined);
        } else {
            return apihelper.APIResponseOK(res, false, "Tidak dapat mengupdate data order, Silahkan coba kembali", undefined);

        }

    } else {
        return apihelper.APIResponseOK(res, false, "Maaf, silahkan cek kembali PIN. PIN tidak sesuai", undefined);
    }
}))

router.post("/upload/temp", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const { file } = req.query;

    var fstream;
    req.pipe(req.busboy);

    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if (!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext == '.bmp')) {
            return apihelper.APIResponseErr(res, false, "Gunakan file format jpg, jpeg, png atau bmp", null);
        }

        var fileAbsPath = moment().format('MMYYYY') + "\\";
        if (!fs.existsSync(config.tempImageUploadPath + fileAbsPath)) {
            fs.mkdirSync(config.tempImageUploadPath + fileAbsPath);
        }

        var rndfileName = strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.tempImageUploadPath + fileAbsPath + rndfileName);
        file.pipe(fstream);
        fstream.on('close', async function () {
            var stats = fs.statSync(config.tempImageUploadPath + fileAbsPath + rndfileName);

            var uploadTempData = {
                size: stats.size,
                name: rndfileName,
                mimetype: mimetype,
                path: fileAbsPath + rndfileName,
                created_at: moment().utc(),
                created_by: req.userId
            }
            var result = await UploadTemp.create(uploadTempData);

            return apihelper.APIResponseOK(res, true, "", {
                token: result._id
            });
        });
    });
}))

router.post("/shop/voucher/purchase", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.quantity))
        return apihelper.APIResponseOK(res, false, "Silahkan isi quantity yg ingin di beli", undefined);

    if (apihelper.isEmptyObj(data.voucher))
        return apihelper.APIResponseOK(res, false, "Silahkan masukan voucher yg akan di beli", undefined);

    if (apihelper.isEmptyObj(data.payment_method))
        return apihelper.APIResponseOK(res, false, "Silahkan pilih payment method", undefined);

    var currentVoucherData = await Voucher.findById({ _id: ObjectID(data.voucher) }).exec();
    if (apihelper.isEmptyObj(currentVoucherData))
        return apihelper.APIResponseOK(res, false, "Silahkan masukan voucher yg akan di beli, atau voucher tidak valid", undefined);


    /*Create transaction*/
    var updateres = { nModified: 0 };

    let session = await mongoose.startSession();
    try {
        var order = new OrderTransaction();
        order.user = req.user;
        order.status = config.transaction_status.WAITING_PAYMENT;
        order.items = [];

        switch (data.payment_method) {
            case 1:
                order.payment_type = config.payment_type.TF;
                break;
            case 2:
                order.payment_type = config.payment_type.EW1;
                break;
            case 3:
                order.payment_type = config.payment_type.EW2;
                break;
            case 4:
                order.payment_type = config.payment_type.DT1;
                break;
            case 5:
                order.payment_type = config.payment_type.DT2;
                break;
            case 6:
                order.payment_type = config.payment_type.DT3;
                break;
            case 7:
                order.payment_type = config.payment_type.VA1;
                break;
            case 8:
                order.payment_type = config.payment_type.VA2;
                break;
            case 9:
                order.payment_type = config.payment_type.VA3;
                break;
            case 10:
                order.payment_type = config.payment_type.VA4;
                break;
            case 11:
                order.payment_type = config.payment_type.VA5;
                break;
            case 12:
                order.payment_type = config.payment_type.VA6;
                break;
        }
        order.payment_to_note = "";
        order.total_item = data.quantity;
        order.created_by = req.user;
        order.created_at = moment().utc().toDate();
        order.expired_at = moment().utc().add(24, 'hours').toDate();

        order.items.push({
            voucher: currentVoucherData._id,
            quantity: data.quantity,
            price: currentVoucherData.price,
            subtotal: currentVoucherData.price * data.quantity
        });
        //Transaction Fee
        order.transaction_fee = 0;

        order.subtotal = currentVoucherData.price * data.quantity;
        order.grant_total = currentVoucherData.price * data.quantity;


        /*Update no ORder*/
        var cdate = moment().utc().format('YYYY-MM');

        var counter = await CounterSchema.findOneAndUpdate({ counter_name: config.const.COUNTER_ORDER },
            [{ $addFields: { last_retrieve_date: cdate, value: { $cond: [{ $eq: ["$last_retrieve_date", cdate] }, { $add: ["$value", 1] }, 1] } } }]);
        order.transaction_no = `ORD-${stringHelper.generateRandomNumber(3)}-${stringHelper.generateRandomCapital(5)}`
        order.invoice_no = ("INV" + apihelper.getMonthYear() + apihelper.paddingZero(counter.value, 5));

        //#Update#
        await session.withTransaction(async () => {
            await OrderTransaction.create([order], { session: session });
            //Looping
            {
                currentVoucherData = await Voucher.findById({ _id: ObjectID(data.voucher) }).exec();
                if ((currentVoucherData.wallet_count - currentVoucherData.purchase_count - currentVoucherData.intransaction_count) <= 0) {
                    throw new Error("Maaf, voucher ini telah habis terjual");
                }

                var updateData = {
                    $inc: { intransaction_count: data.quantity, __v: 1 }
                }

                updateres = await Voucher.update({ _id: ObjectID(data.voucher), __v: currentVoucherData.__v }, updateData, { session: session });
                if (updateres.nModified == 0)
                    apihelper.sleep(100);
            } while (updateres.nModified == 0);
        });

        return apihelper.APIResponseOK(res, true, "Berhasil Melakukan Pesanan", {
            transaction_id: order._id,
            transaction_no: order.transaction_no,
            invoice_no: order.invoice_no,
            transaction_fee: order.transaction_fee,
            grant_total: order.grant_total,
            expired_date: order.expired_at,
            created_at: order.created_at
        });
    } catch (exc) {
        return apihelper.APIResponseOK(res, false, exc.message, undefined);
    } finally {
        session.endSession();
    }
}))

// Payment Gateway
/* ################ CALLBACK ######################### */
router.post("/callback_va", apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body
    var auth = req.headers['x-callback-token']

    if (auth != config.xendit_callback_auth) {
        return apiHelper.APIResponseErr(res, false, undefined, undefined);
    }

    if (apiHelper.isEmptyObj(data.payment_id)) {
        const update = {
            va_status: data.status
        }
        var result = await VirtualAccount.findOneAndUpdate({ va_xendit_external_id: data.external_id }, update).exec();
    } else {
        var idTrans = data.external_id.split('-')[3];

        var dataPayment = {
            va_payment_xendit_id: data.callback_virtual_account_id,
            va_payment_xendit_id: data.payment_id,
            va_payment_received_at: data.created
        }

        const update = {
            va_status: "PAID",
            va_payment_data: dataPayment
        }

        var result = await VirtualAccount.findOneAndUpdate({ va_xendit_external_id: data.external_id }, update).exec();
        var updateOrder = await OrderTransaction.findByIdAndUpdate({ _id: idTrans }, {
            user_confirm_payment_date: moment().utc().toDate(),
            confirm_payment_date: moment().utc().toDate(),
            updated_at: moment().utc().toDate()
        }).exec();
        if (updateOrder) {
            var dataTrans = await OrderTransaction.findOne({ _id: idTrans },
                `
                _id
                user
                transaction_no
                `
            ).exec();

            const notification = {
                filters: [
                    {
                        field: "tag",
                        relation: "=",
                        key: "user_id",
                        value: dataTrans.user
                    }
                ],
                headings: {
                    'en': "Pembayaran Anda berhasil!"
                },
                contents: {
                    'en': `Lihat voucher tranksaksi ${dataTrans.transaction_no} di menu Toko, Voucher Saya.`
                },
            };

            apihelper.sendPushNotification(notification)

            var currentOrderData = await OrderTransaction.findById({ _id: idTrans }).exec();

            var isMembership = false
            if(currentOrderData.membership_data != undefined){
                isMembership = true
                
                var mbUpdate = await Membership.findOneAndUpdate({_id: currentOrderData.membership_data}, {membership_status : "ACTIVE"}).exec()
            }

            var updateres = { nModified: 0 };

            let session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {

                    var result = await OrderTransaction.findOneAndUpdate({ _id: idTrans }, {
                        status: config.transaction_status.FINISHED
                    }, { session }).exec();

                    for (var x = 0; x < currentOrderData.items.length; x++) {
                        var item = currentOrderData.items[x];
                        if (Boolean(item.voucher)) {

                            var availableWallet = await VoucherWallet.find({ voucher: item.voucher, purchase_transaction_id: null, revoke_date: null }).exec();
                            var counter = 0;
                            var fullfiledCount = 0;
                            if (availableWallet != null && availableWallet.length >= item.quantity) {
                                for (var idx = 0; idx < item.quantity; idx++) {
                                    {
                                        var tmpWallet = availableWallet[counter];

                                        var updateresVoucherWallet = await VoucherWallet.update({ _id: tmpWallet._id, __v: tmpWallet.__v }, {
                                            $inc: {
                                                intransaction_count: -item.quantity,
                                                purchase_count: item.quantity,
                                                __v: 1
                                            },
                                            is_membership: isMembership,
                                            purchase_transaction_id: currentOrderData._id,
                                            purchase_note: "TRANSACTION",
                                            purchase_date: moment().utc().toDate(),
                                            user: currentOrderData.user,
                                            status: config.voucher_wallet_status.NEW
                                        }, { session: session });

                                        counter++;
                                        if (updateresVoucherWallet.nModified == 1)
                                            fullfiledCount++;
                                    } while (availableWallet.length < counter && updateresVoucherWallet.nModified == 0);
                                }
                            } else {
                                throw new Error("Jumlah wallet kosong " + availableWallet.length);
                            }
                            if (fullfiledCount != item.quantity) {
                                throw new Error("Jumlah wallet kosong " + availableWallet.length);
                            }

                            {
                                currentVoucherData = await Voucher.findById({ _id: ObjectID(item.voucher) }).exec();
                                var updateData = {
                                    $inc: {
                                        intransaction_count: -item.quantity,
                                        purchase_count: item.quantity,
                                        __v: 1
                                    }
                                }

                                updateres = await Voucher.update({ _id: ObjectID(item.voucher), __v: currentVoucherData.__v }, updateData,
                                    { session: session });

                                if (updateres.nModified == 0)
                                    apihelper.sleep(100);

                            } while (updateres.nModified == 0);
                        }
                    }
                });
            } catch (e) {
               await OrderTransaction.findOneAndUpdate({ _id: idTrans }, {
                    status: config.transaction_status.CONFIRMED
                }).exec()
            } finally {
                session.endSession();
            }
        }
    }

    return apiHelper.APIResponseOK(res, true, undefined, undefined);
}))

router.post("/callback_ewallet", apiHelper.handleErrorAsync(async (req, res, next) => {
    var body = req.body
    var auth = req.headers['x-callback-token']

    if (auth != config.xendit_callback_auth) {
        return apiHelper.APIResponseErr(res, false, undefined, undefined);
    }

    if (body.data.status == "SUCCEEDED") {
        var idTrans = body.data.reference_id.split('-')[3];
        const update = {
            wa_status: "PAID",
            updated_at: body.data.updated
        }
        var updateEW = await Ewallet.findOne({ wa_xendit_charge_id: body.data.id }).exec();
        if(updateEW.wa_status != "PAID"){
            var updateEW = await Ewallet.findOneAndUpdate({ wa_xendit_charge_id: body.data.id }, update).exec();
        }

        var updateOrder = await OrderTransaction.findByIdAndUpdate({ _id: idTrans }, {
            user_confirm_payment_date: moment().utc().toDate(),
            confirm_payment_date: moment().utc().toDate(),
            updated_at: moment().utc().toDate()
        }).exec();

        if (updateOrder) {
            var dataTrans = await OrderTransaction.findOne({ _id: idTrans },
                `
                _id
                user
                transaction_no
                `
            ).exec();

            const notification = {
                filters: [
                    {
                        field: "tag",
                        relation: "=",
                        key: "user_id",
                        value: dataTrans.user
                    }
                ],
                headings: {
                    'en': "Pembayaran Anda berhasil!"
                },
                contents: {
                    'en': `Lihat voucher tranksaksi ${dataTrans.transaction_no} di menu Toko, Voucher Saya.`
                },
            };

            apihelper.sendPushNotification(notification)

            var currentOrderData = await OrderTransaction.findById({ _id: idTrans }).exec();

            var isMembership = false
            if(currentOrderData.membership_data != undefined){
                isMembership = true

                var mbUpdate = await Membership.findOneAndUpdate({_id: currentOrderData.membership_data}, {membership_status : "ACTIVE"}).exec()
            }

            var updateres = { nModified: 0 };

            let session = await mongoose.startSession();
            try {
                await session.withTransaction(async () => {

                    var result = await OrderTransaction.findOneAndUpdate({ _id: idTrans }, {
                        status: config.transaction_status.FINISHED,
                    }, { session }).exec();

                    for (var x = 0; x < currentOrderData.items.length; x++) {
                        var item = currentOrderData.items[x];
                        if (Boolean(item.voucher)) {

                            var availableWallet = await VoucherWallet.find({ voucher: item.voucher, purchase_transaction_id: null, revoke_date: null }).exec();
                            var counter = 0;
                            var fullfiledCount = 0;
                            if (availableWallet != null && availableWallet.length >= item.quantity) {
                                for (var idx = 0; idx < item.quantity; idx++) {
                                    {
                                        var tmpWallet = availableWallet[counter];

                                        var updateresVoucherWallet = await VoucherWallet.update({ _id: tmpWallet._id, __v: tmpWallet.__v }, {
                                            $inc: {
                                                intransaction_count: -item.quantity,
                                                purchase_count: item.quantity,
                                                __v: 1
                                            },
                                            is_membership: isMembership,
                                            purchase_transaction_id: currentOrderData._id,
                                            purchase_note: "TRANSACTION",
                                            purchase_date: moment().utc().toDate(),
                                            user: currentOrderData.user,
                                            status: config.voucher_wallet_status.NEW
                                        }, { session: session });

                                        counter++;
                                        if (updateresVoucherWallet.nModified == 1)
                                            fullfiledCount++;
                                    } while (availableWallet.length < counter && updateresVoucherWallet.nModified == 0);
                                }
                            } else {
                                throw new Error("Jumlah wallet kosong " + availableWallet.length);
                            }
                            if (fullfiledCount != item.quantity) {
                                throw new Error("Jumlah wallet kosong " + availableWallet.length);
                            }

                            {
                                currentVoucherData = await Voucher.findById({ _id: ObjectID(item.voucher) }).exec();
                                var updateData = {
                                    $inc: {
                                        intransaction_count: -item.quantity,
                                        purchase_count: item.quantity,
                                        __v: 1
                                    }
                                }

                                updateres = await Voucher.update({ _id: ObjectID(item.voucher), __v: currentVoucherData.__v }, updateData,
                                    { session: session });

                                if (updateres.nModified == 0)
                                    apihelper.sleep(100);

                            } while (updateres.nModified == 0);
                        }
                    }
                });
            } catch (e) {
                await OrderTransaction.findOneAndUpdate({ _id: idTrans }, {
                    status: config.transaction_status.CONFIRMED
                }).exec()
            } finally {
                session.endSession();
            }
        }
    }

    return apiHelper.APIResponseOK(res, true, undefined, undefined);
}))

router.post("/callback", apiHelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body
    console.log(data)

    return apiHelper.APIResponseOK(res, true, undefined, undefined);
}))

/* ################ VIRTUAL ACCOUNT ######################### */
router.post("/payment_gateway/create_va", authM, apiHelper.handleErrorAsync(async (req, res, next) => {

    var data = req.body
    var amount = {}

    if (apiHelper.isEmptyObj(data.bank_name))
        return apiHelper.APIResponseBR(res, false, "Kode Bank Tidak boleh kosong!", undefined);
    if (apiHelper.isEmptyObj(data.transaction_id))
        return apiHelper.APIResponseBR(res, false, "ID Transaksi Tidak boleh kosong !", undefined);

    var dataTrans = await OrderTransaction.findOne({ _id: data.transaction_id },
        `
        _id
        user
        grant_total
        `).exec();

    if (req.user._id != dataTrans.user) {
        return apiHelper.APIResponseBR(res, false, "Transaksi Tidak Sah !", undefined);
    } else {
        amount = dataTrans.grant_total
    }

    /*Currently, Xendit supports BCA, BNI, BRI, BJB, BSI, BSS (Bank Sahabat Sampoerna), CIMB, MANDIRI, and PERMATA Virtual Accounts. */
    var bankName
    switch (data.bank_name) {
        case 1:
            bankName = "BRI";
            break;
        case 2:
            bankName = "MANDIRI";
            break;
        case 3:
            bankName = "BNI";
            break;
        case 4:
            bankName = "PERMATA";
            break;
        case 5:
            bankName = "BCA";
            break;
        case 6:
            bankName = "SAHABAT_SAMPOERNA";
            break;
    }
    var url = `${config.xendit_base_url}/callback_virtual_accounts`

    const requestBody = {
        external_id: `VA-${stringHelper.generateRandomNumber(5)}-${stringHelper.generateRandomCapital(5)}-${dataTrans._id}`,
        bank_code: bankName,
        name: nameVA,
        is_closed: true,
        is_single_use: true,
        expected_amount: amount,
        expiration_date: moment().utc().add(1, 'days').toDate()
    }

    try {
        const request = await fetch(url, {
            method: 'post',
            body: JSON.stringify(requestBody),
            headers: fetchHeader
        })

        const result = await request.json()

        const savingVA = {
            va_status: result.status,
            va_transaction_id: data.transaction_id,
            va_xendit_id: result.id,
            va_xendit_bank_code: result.mechant_code,
            va_xendit_owner_id: result.owner_id,
            va_is_locked: result.is_closed,
            va_currency: result.currency,
            va_xendit_external_id: result.external_id,
            va_bank_name: result.bank_code,
            va_number: result.account_number,
            va_requester: req.user,
            va_expired_at: result.expiration_date,
            created_at: moment().utc().toDate(),
            updated_at: moment().utc().toDate()
        }
        var saveVA = await VirtualAccount.create(savingVA)

        const generatedVA = {
            _id: saveVA._id,
            transaction_id: data.transaction_id,
            virtual_account_id: result.owner_id,
            virtual_account_transaction_id: result.external_id,
            virtual_account_name: result.bank_code,
            virtual_account_number: result.account_number,
            virtual_account_amount_pay: result.expected_amount,
            virtual_account_expired_at: result.expiration_date
        }
        if (saveVA) {

            var updateOrder = await OrderTransaction.updateOne({ _id: data.transaction_id }, { $set: { virtual_account: saveVA._id } })

            return apiHelper.APIResponseOK(res, true, "Berhasil Membuat VA Baru", generatedVA)
        } else {
            return apiHelper.APIResponseErr(res, true, "Terjadi Kesalahan Silahkan Coba Lagi", undefined)
        }

    } catch (error) {
        return apiHelper.APIResponseErr(res, false, error, undefined)
    }
}))

router.get("/payment_gateway/va_detail/:id", authM, apiHelper.handleErrorAsync(async (req, res, next) => {
    var dataId = new ObjectID(req.params.id);

    var filter = {
        _id: dataId
    };

    var result = await VirtualAccount.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "va_transaction_id",
                foreignField: "_id",
                as: "transaction_data"
            }
        },
        {
            $unwind: {
                "path": "$transaction_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'va_status': 1, 'va_xendit_id': 1, 'va_xendit_external_id': 1, 'va_bank_name': 1, 'va_number': 1, 'va_expired_at': 1, 'created_at': 1, 'updated_at': 1,
                'transaction_data': { '_id': 1, 'transaction_no': 1, 'invoice_no': 1, 'transaction_fee': 1, 'created_at': 1, 'grant_total': 1 }
            }
        }
    ]).exec();

    if (apiHelper.isEmptyObj(result))
        return apiHelper.APIResponseNF(res, false, "Data VA tidak ditemukan", undefined);

    return apiHelper.APIResponseOK(res, true, undefined, result);
}))

/* ################ E Wallet ######################### */
router.post("/payment_gateway/charge_ewallet", authM, apiHelper.handleErrorAsync(async (req, res, next) => {

    var data = req.body
    var charge_amount = {}

    if (apiHelper.isEmptyObj(data.ewallet_type))
        return apiHelper.APIResponseBR(res, false, "Kode E-Wallet Tidak boleh kosong!", undefined);
    if (apiHelper.isEmptyObj(data.transaction_id))
        return apiHelper.APIResponseBR(res, false, "ID Transaksi Tidak boleh kosong!", undefined);

    var dataTrans = await OrderTransaction.findOne({ _id: data.transaction_id },
        `
        _id
        user
        grant_total
        transaction_no
        created_at
        `).exec();

    if (req.user._id != dataTrans.user) {
        return apiHelper.APIResponseBR(res, false, "Transaksi Tidak Sah !", undefined);
    } else {
        charge_amount = dataTrans.grant_total
    }

    /*Currently, Xendit supports OVO,LINKAJA,DANA,ShopeePay. */
    var eWalletName
    switch (data.ewallet_type) {
        case 1:
            eWalletName = "ID_OVO";
            break;
        case 2:
            eWalletName = "ID_SHOPEEPAY";
            break;
        case 3:
            eWalletName = "ID_DANA";
            break;
        case 4:
            eWalletName = "ID_LINKAJA";
            break;
    }
    var url = `${config.xendit_base_url}/ewallets/charges`

    if (eWalletName == "ID_OVO") {

        if (apiHelper.isEmptyObj(data.phone_number))
            return apiHelper.APIResponseBR(res, false, "Nomor Telpon Tidak Boleh Kosong!", undefined);

        const chProperties = {
            mobile_number: data.phone_number
        }

        const ewMetaData = {
            transaction_no: dataTrans.transaction_no,
            transaction_amount: dataTrans.grant_total,
            transaction_date: dataTrans.created_at
        }

        const requestBody = {
            reference_id: `WL-${stringHelper.generateRandomNumber(5)}-${stringHelper.generateRandomCapital(5)}-${dataTrans._id}`,
            currency: "IDR",
            amount: charge_amount,
            checkout_method: "ONE_TIME_PAYMENT",
            channel_code: eWalletName,
            channel_properties: chProperties,
            metadata: ewMetaData
        }

        try {
            const request = await fetch(url, {
                method: 'post',
                body: JSON.stringify(requestBody),
                headers: fetchHeader
            })

            const result = await request.json()

            const savingEW = {
                wa_xendit_charge_id: result.id,
                wa_xendit_business_id: result.business_id,
                wa_xendit_reference_id: result.reference_id,
                wa_transaction_id: dataTrans._id,
                wa_status: result.status,
                wa_currency: result.currency,
                wa_name: result.channel_code.split('_')[1],
                wa_channel_code: result.channel_code,
                wa_charge_amount: result.charge_amount,
                wa_capture_amount: result.capture_amount,
                wa_refunded_amount: "0",
                wa_checkout_method: result.checkout_method,
                created_at: moment().utc().toDate(),
                updated_at: moment().utc().toDate(),
                wa_properties: {
                    wa_properties_phone_number: result.channel_properties.mobile_number
                },
                wa_metadata: {
                    wa_metadata_transaction_no: result.metadata.transaction_no,
                    wa_metadata_transaction_amount: result.metadata.transaction_amount,
                    wa_metadata_transaction_date: result.metadata.transaction_date
                }
            }
            var saveEW = await Ewallet.create(savingEW)

            if (saveEW) {
                var updateOrder = await OrderTransaction.updateOne({ _id: data.transaction_id }, { $set: { e_wallet: saveEW._id } })

                const show = {
                    ewallet_id: saveEW._id,
                }

                return apiHelper.APIResponseOK(res, true, "Berhasil, Silahkan lanjutkan pembayaran pada aplikasi OVO", show)
            } else {
                return apiHelper.APIResponseErr(res, true, "Terjadi Kesalahan Silahkan Coba Lagi", undefined)
            }

        } catch (error) {
            return apiHelper.APIResponseErr(res, false, error, undefined)
        }
    } else {
        if (apiHelper.isEmptyObj(data.redirect_type))
            return apiHelper.APIResponseBR(res, false, "Jenis Redirect Tidak Boleh Kosong!", undefined);

        var chProperties = {}

        switch (data.redirect_type) {
            case "ANDROID":
                chProperties.success_redirect_url = "salute://e-wallet/root"
                break
            case "WEB":
                chProperties.success_redirect_url = "http://localhost:3000/redirect"
        }


        const ewMetaData = {
            transaction_no: dataTrans.transaction_no,
            transaction_amount: dataTrans.grant_total,
            transaction_date: dataTrans.created_at
        }

        const requestBody = {
            reference_id: `WL-${stringHelper.generateRandomNumber(5)}-${stringHelper.generateRandomCapital(5)}-${dataTrans._id}`,
            currency: "IDR",
            amount: charge_amount,
            checkout_method: "ONE_TIME_PAYMENT",
            channel_code: eWalletName,
            channel_properties: chProperties,
            metadata: ewMetaData
        }

        try {
            const request = await fetch(url, {
                method: 'post',
                body: JSON.stringify(requestBody),
                headers: fetchHeader
            })

            const result = await request.json()

            const savingEW = {
                wa_xendit_charge_id: result.id,
                wa_xendit_business_id: result.business_id,
                wa_xendit_reference_id: result.reference_id,
                wa_transaction_id: dataTrans._id,
                wa_status: result.status,
                wa_currency: result.currency,
                wa_name: result.channel_code.split('_')[1],
                wa_channel_code: result.channel_code,
                wa_charge_amount: result.charge_amount,
                wa_capture_amount: result.capture_amount,
                wa_refunded_amount: "0",
                wa_checkout_method: result.checkout_method,
                created_at: moment().utc().toDate(),
                updated_at: moment().utc().toDate(),
                wa_metadata: {
                    wa_metadata_transaction_no: result.metadata.transaction_no,
                    wa_metadata_transaction_amount: result.metadata.transaction_amount,
                    wa_metadata_transaction_date: result.metadata.transaction_date
                },
                wa_payment_data: {
                    wa_payment_mobile_web_url: result.actions.desktop_web_checkout_url,
                    wa_payment_dekstop_web_url: result.actions.mobile_web_checkout_url,
                    wa_payment_mobile_deeplink_url: result.actions.mobile_deeplink_checkout_url,
                    wa_payment_qr_code_string: result.actions.qr_checkout_string
                }
            }
            var saveEW = await Ewallet.create(savingEW)

            if (saveEW) {
                var updateOrder = await OrderTransaction.updateOne({ _id: data.transaction_id }, { $set: { e_wallet: saveEW._id } })
                const show = {
                    ewallet_id: saveEW._id,
                    ewallet_dekstop_web_checkout_url: result.actions.desktop_web_checkout_url,
                    ewallet_mobile_web_checkout_url: result.actions.mobile_web_checkout_url,
                    ewallet_mobile_deeplink_checkout_url: result.actions.mobile_deeplink_checkout_url,
                    ewallet_qr_checkout_string: result.actions.qr_checkout_string
                }

                return apiHelper.APIResponseOK(res, true, "Berhasil, Silahkan lanjutkan pembayaran pada aplikasi terkait", show)
            } else {
                return apiHelper.APIResponseErr(res, true, "Terjadi Kesalahan Silahkan Coba Lagi", undefined)
            }

        } catch (error) {
            return apiHelper.APIResponseErr(res, false, error, undefined)
        }
    }
}))

router.get("/payment_gateway/ewallet_detail/:id", authM, apiHelper.handleErrorAsync(async (req, res, next) => {
    var dataId = new ObjectID(req.params.id);

    var filter = {
        _id: dataId
    };

    var result = await Ewallet.aggregate([
        { $match: filter },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "wa_transaction_id",
                foreignField: "_id",
                as: "transaction_data"
            }
        },
        {
            $unwind: {
                "path": "$transaction_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1, 'wa_status': 1, 'wa_xendit_charge_id': 1, 'wa_xendit_business_id': 1, 'wa_transaction_id': 1, 'wa_name': 1, 'wa_channel_code': 1, 'wa_payment_data': 1, 'created_at': 1,
                'transaction_data': { '_id': 1, 'transaction_no': 1, 'invoice_no': 1, 'transaction_fee': 1, 'created_at': 1, 'grant_total': 1 }
            }
        }
    ]).exec();

    if (apiHelper.isEmptyObj(result))
        return apiHelper.APIResponseNF(res, false, "Data Electronic Wallet tidak ditemukan", undefined);

    return apiHelper.APIResponseOK(res, true, undefined, result);
}))

//Membership
router.post("/membership/purchase", authM, apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.quantity))
        return apihelper.APIResponseBR(res, false, "Silahkan isi quantity yg ingin di beli", undefined);

    if (apihelper.isEmptyObj(data.voucher))
        return apihelper.APIResponseBR(res, false, "Silahkan masukan  id voucher yg akan di beli", undefined);

    if (apihelper.isEmptyObj(data.payment_method))
        return apihelper.APIResponseBR(res, false, "Silahkan pilih payment method", undefined);

    if (apihelper.isEmptyObj(data.member_nik))
        return apihelper.APIResponseBR(res, false, "Silahkan isi data nik", undefined);

    if (data.member_nik.length != 16)
        return apihelper.APIResponseBR(res, false, "Nomor NIK tidak valid", undefined);

    if (apihelper.isEmptyObj(data.member_name))
        return apihelper.APIResponseBR(res, false, "Silahkan isi nama member", undefined);

    if (apihelper.isEmptyObj(data.member_birthdate))
        return apihelper.APIResponseBR(res, false, "Silahkan isi tanggal lahir member", undefined);

    if (apihelper.isEmptyObj(data.member_birthplace))
        return apihelper.APIResponseBR(res, false, "Silahkan isi tempat lahir member", undefined);

    if (apihelper.isEmptyObj(data.member_email))
        return apihelper.APIResponseBR(res, false, "Silahkan isi alamat email member", undefined);

    if (apihelper.isEmptyObj(data.member_address))
        return apihelper.APIResponseBR(res, false, "Silahkan isi alamat tempat tinggal member", undefined);

    if (apihelper.isEmptyObj(data.member_benefit_receiver))
        return apihelper.APIResponseBR(res, false, "Silahkan isi penerima manfaat member", undefined);


    var currentVoucherData = await Voucher.findById({ _id: ObjectID(data.voucher) }).exec();
    if (apihelper.isEmptyObj(currentVoucherData))
        return apihelper.APIResponseOK(res, false, "Silahkan masukan voucher yg akan di beli, atau voucher tidak valid", undefined);


    /*Create transaction*/
    var updateres = { nModified: 0 };

    let session = await mongoose.startSession();
    try {
        var order = new OrderTransaction();
        order.user = req.user;
        order.status = config.transaction_status.WAITING_PAYMENT;
        order.items = [];

        switch (data.payment_method) {
            case 1:
                order.payment_type = config.payment_type.TF;
                break;
            case 2:
                order.payment_type = config.payment_type.EW1;
                break;
            case 3:
                order.payment_type = config.payment_type.EW2;
                break;
            case 4:
                order.payment_type = config.payment_type.DT1;
                break;
            case 5:
                order.payment_type = config.payment_type.DT2;
                break;
            case 6:
                order.payment_type = config.payment_type.DT3;
                break;
            case 7:
                order.payment_type = config.payment_type.VA1;
                break;
            case 8:
                order.payment_type = config.payment_type.VA2;
                break;
            case 9:
                order.payment_type = config.payment_type.VA3;
                break;
            case 10:
                order.payment_type = config.payment_type.VA4;
                break;
            case 11:
                order.payment_type = config.payment_type.VA5;
                break;
            case 12:
                order.payment_type = config.payment_type.VA6;
                break;
        }
        order.payment_to_note = "";
        order.total_item = data.quantity;
        order.created_by = req.user;
        order.created_at = moment().utc().toDate();
        order.expired_at = moment().utc().add(24, 'hours').toDate();

        order.items.push({
            voucher: currentVoucherData._id,
            quantity: data.quantity,
            price: currentVoucherData.price,
            subtotal: currentVoucherData.price * data.quantity
        });
        //Transaction Fee
        order.transaction_fee = 0;

        order.subtotal = currentVoucherData.price * data.quantity;
        order.grant_total = currentVoucherData.price * data.quantity;


        /*Update no ORder*/
        var cdate = moment().utc().format('YYYY-MM');

        var counter = await CounterSchema.findOneAndUpdate({ counter_name: config.const.COUNTER_ORDER },
            [{ $addFields: { last_retrieve_date: cdate, value: { $cond: [{ $eq: ["$last_retrieve_date", cdate] }, { $add: ["$value", 1] }, 1] } } }]);
        order.transaction_no = `ORD-${stringHelper.generateRandomNumber(3)}-${stringHelper.generateRandomCapital(5)}`
        order.invoice_no = ("INV" + apihelper.getMonthYear() + apihelper.paddingZero(counter.value, 5));

        var membership = await Membership.create({
            membership_id : ("MBR" + apihelper.getMonthYear() + apihelper.paddingZero(counter.value, 5)),
            member_nik : data.member_nik,
            member_name : data.member_name,
            member_birthdate : data.member_birthdate,
            member_birthplace : data.memberplace,
            member_email : data.member_email,
            member_address : data.member_address,
            member_benefit_receiver_name : data.member_benefit_receiver,
            member_created_at: moment().utc().toDate(),
            moment_updated_at : moment().utc().toDate()
        })
        order.membership_data = membership._id

        //#Update#
        await session.withTransaction(async () => {
            await OrderTransaction.create([order], { session: session });
            //Looping
            {
                currentVoucherData = await Voucher.findById({ _id: ObjectID(data.voucher) }).exec();
                if ((currentVoucherData.wallet_count - currentVoucherData.purchase_count - currentVoucherData.intransaction_count) <= 0) {
                    throw new Error("Maaf, voucher ini telah habis terjual");
                }

                var updateData = {
                    $inc: { intransaction_count: data.quantity, __v: 1 }
                }

                updateres = await Voucher.update({ _id: ObjectID(data.voucher), __v: currentVoucherData.__v }, updateData, { session: session });
                if (updateres.nModified == 0)
                    apihelper.sleep(100);
            } while (updateres.nModified == 0);

        });

        var updateMembership = await Membership.updateOne({ _id: membership._id }, { $set: { member_transaction_id: order._id } })

        return apihelper.APIResponseOK(res, true, "Berhasil Melakukan Pesanan Membership", {
            transaction_id: order._id,
            transaction_no: order.transaction_no,
            membership_id: membership._id,
            invoice_no: order.invoice_no,
            transaction_fee: order.transaction_fee,
            grant_total: order.grant_total,
            expired_date: order.expired_at,
            created_at: order.created_at
        });

    } catch (exc) {
        return apihelper.APIResponseErr(res, false, exc.message, undefined);
    } finally {
        session.endSession();
    }
}))

module.exports = router;