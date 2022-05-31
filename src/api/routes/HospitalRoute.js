const config = require('../config/config');
const router = require('express').Router();
const Hospital = require('../models/Hospital');
const apihelper = require('../helper/APIHelper');
const Province = require('../models/Province');
const City = require('../models/City');
const District = require('../models/District');
const Subdistrict = require('../models/Subdistrict');


const authM = apihelper.auth(['ADM',"CL"]);

router.get("/", apihelper.authAccessOr({MHOSPITAL:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Hospital.paginate(finalQuery, { 
        select: "_id code name address address_completeaddress_complete zipcode phone1 qrcode longitude latitude is_active created_at updated_at",
        page: page, 
        limit: parseInt(perpage),
        populate: { path: 'province city district subdistrict', select: '_id code name' },
        lean: true,
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


router.get("/detail/:id", apihelper.authAccessOr({MHOSPITAL:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var result = await Hospital.findOne(finalQuery).exec();
    if(apihelper.isEmptyObj(result))
        return apihelper.APIResponseOK(res, false,"Data not found",undefined);

    if(Boolean(result.province))
        result.province = await Province.findByIdAndUpdate({_id: result.province},"_id name").exec();

    if(Boolean(result.city))
        result.city = await City.findByIdAndUpdate({_id: result.city},"_id name").exec();

    if(Boolean(result.district))
        result.district = await District.findByIdAndUpdate({_id: result.district},"_id name").exec();

    if(Boolean(result.subdistrict))
        result.subdistrict = await Subdistrict.findByIdAndUpdate({_id: result.subdistrict},"_id name").exec();

    if(Boolean(result.updated_by))
        result.updated_by = await Admin.findByIdAndUpdate({_id: result.updated_by},"_id name").exec();

    if(Boolean(result.created_by))
        result.created_by = await Admin.findByIdAndUpdate({_id: result.created_by},"_id name").exec();

    return apihelper.APIResponseOK(res,true,"",result);
}))


router.get("/selection/", apihelper.authAccessOr({
    MHOSPITAL:config.action.View,
    CLAIM:config.action.View|config.action.Create|config.action.Update,
    CLAIMPROCESS:config.action.View|config.action.Create|config.action.Update
}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var finalQuery = {type:{$ne:'INSURANCE'}}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery.name = q;
    }


    var result = Hospital.paginate(finalQuery, { 
        select: "_id code name",
        page:  page, 
        limit: parseInt(perpage)
    }).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

router.get("/selection_all/", apihelper.authAccessOr({
    MHOSPITAL:config.action.View,
    CLAIM:config.action.View|config.action.Create|config.action.Update,
    CLAIMPROCESS:config.action.View|config.action.Create|config.action.Update
}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var finalQuery = {}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery.name = q;
    }

    var result = Hospital.paginate(finalQuery, { 
        select: "_id code name",
        page:  page, 
        limit: parseInt(perpage)
    }).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {

    var data = req.body;
    const Crypto = require('crypto');

    if(apihelper.isEmptyObj(data.type))
        return apihelper.APIResponseOK(res, false, "Silahkan isi type Provider",undefined);

    if(apihelper.isEmptyObj(data.code))
        return apihelper.APIResponseOK(res, false, "Silahkan isi kode Provider",undefined);

    if(apihelper.isEmptyObj(data.code))
        return apihelper.APIResponseOK(res, false, "Silahkan isi nama Provider",undefined);

    if(apihelper.isEmptyObj(data.phone1))
        return apihelper.APIResponseOK(res, false, "Silahkan isi no telephone Provider",undefined);

    if(apihelper.isEmptyObj(data.admin_email))
        return apihelper.APIResponseOK(res, false, "Silahkan isi Email Provider",undefined);


    data.address_complete  = data.address;

    if(Boolean(data.province)) {
        data.province = await Province.findOne({_id: data.province},"_id name").exec();
        if(apihelper.isEmptyObj(data.province))
            return apihelper.APIResponseOK(res, false,"provinsi tidak ditemukan",undefined);
        data.address_complete = data.address_complete + " PROVINSI " + data.province.name; 
    }

    if(Boolean(data.city)) {
        data.city = await City.findOne({_id: data.city},"_id name").exec();
        if(apihelper.isEmptyObj(data.city))
            return apihelper.APIResponseOK(res, false,"kota tidak ditemukan",undefined);

        data.address_complete = data.address_complete + " KOTA " + data.city.name; 
    }

    if(Boolean(data.district)) {
        data.district = await District.findOne({_id: data.district},"_id name").exec();
        if(apihelper.isEmptyObj(data.district))
            return apihelper.APIResponseOK(res, false,"kecamatan tidak ditemukan",undefined);

        data.address_complete = data.address_complete + " KECAMATAN " + data.district.name; 
    }
    if(Boolean(data.subdistrict)) {
        data.subdistrict = await Subdistrict.findOne({_id: data.subdistrict},"_id name").exec();
        if(apihelper.isEmptyObj(data.subdistrict))
            return apihelper.APIResponseOK(res, false,"kelurahan tidak ditemukan",undefined);
            
        data.address_complete = data.address_complete + " KELURAHAN " + data.subdistrict.name; 
    }


    if(data._id) {
        var result = await Hospital.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{        
        data.qrcode = Crypto
        .randomBytes(50)
        .toString('base64')
        .slice(0, 50)
        + data.code;        

        var result = await Hospital.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/", apihelper.authAccessOr({MHOSPITAL:config.action.Create}) ,dataFunc )

router.post("/", apihelper.authAccessOr({MHOSPITAL:config.action.Update}) ,dataFunc )

router.delete("/:id", apihelper.authAccessOr({MHOSPITAL:config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Hospital.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))

module.exports = router;