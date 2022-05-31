const config = require('../config/config');
const router = require('express').Router();
const Subdistrict = require('../models/Subdistrict');
const apihelper = require('../helper/APIHelper');



router.get("/", apihelper.authAccessOr({MVILLAGE:config.action.View}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Subdistrict.paginate(finalQuery, { 
        select: "_id code name district is_active created_at updated_at",
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))



router.get("/selection/", apihelper.authAccessOr({
    MVILLAGE :config.action.View,
    MHOSPITAL:config.action.View|config.action.Create|config.action.Update,
    MUSER:config.action.View|config.action.Create|config.action.Update
    }) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = {is_active:true}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Subdistrict.paginate(finalQuery, { 
        select: "_id code name ",
        page: page, 
        limit: parseInt(perpage)
    }).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if(apihelper.isEmptyObj(data.district))
    return apihelper.APIResponseOK(res, false, "Silahkan isi kecamatan",undefined);

    if(apihelper.isEmptyObj(data.code))
        return apihelper.APIResponseOK(res, false, "Silahkan kode kelurahan",undefined);

    if(apihelper.isEmptyObj(data.name))
        return apihelper.APIResponseOK(res, false, "Silahkan nama kelurahan",undefined);

    
    if(data._id) {
        var result = await Subdistrict.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{
        var result = await Subdistrict.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/", apihelper.authAccessOr({MVILLAGE:config.action.Create}) ,dataFunc)

router.post("/", apihelper.authAccessOr({MVILLAGE:config.action.Update}) ,dataFunc)

router.delete("/:id", apihelper.authAccessOr({MVILLAGE:config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Subdistrict.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;