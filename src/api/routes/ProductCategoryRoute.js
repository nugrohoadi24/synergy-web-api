const config = require('../config/config');
const router = require('express').Router();
const ProductCategory = require('../models/ProductCategory');
const UploadTemp = require('../models/UploadTemp');
const apihelper = require('../helper/APIHelper');
const moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');


router.get("/", apihelper.authAccessOr({PRODUCTCATEGORY:config.action.View}) ,apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = ProductCategory.paginate(finalQuery, { 
        select: "_id name description image is_active created_by created_at updated_at updated_by",
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))



router.get("/selection/", apihelper.authAccessOr({
    PRODUCTCATEGORY :config.action.View,
    VOUCHER:config.action.View|config.action.Create|config.action.Update
    }) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = {is_active:true}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = ProductCategory.paginate(finalQuery, { 
        select: "_id name",
        page: page, 
        limit: parseInt(perpage)
    }).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if(apihelper.isEmptyObj(data.name))
    return apihelper.APIResponseOK(res, false, "Silahkan isi nama",undefined);

    if(apihelper.isEmptyObj(data.description))
        return apihelper.APIResponseOK(res, false, "Silahkan isi description",undefined);
    
    var imageTempData = null;
    var imageToken = "";
    if(data.image_token){
        imageTempData = await UploadTemp.findOne({_id:ObjectID(data.image_token)}).lean().exec()
        imageToken = data.image_token;
        data.image_token = undefined;
    }

    if(data._id) {
        if(imageTempData != null) {
            var resultImage = await UploadTemp.findByIdAndRemove(imageToken).exec();            
            data.image = resultImage.name;
            fs.rename(config.tempImageUploadPath + imageTempData.path, config.productCategoryImagePath + resultImage.name, function (err) {
                if (err) throw err
                console.log('Successfully renamed - AKA moved!')
            })
        }
        data.updated_by = req.user;
        data.updated_at = moment().utc().toDate();  

        var result = await ProductCategory.findByIdAndUpdate({_id:data._id}, data).exec();        
    }else{        
        if(imageTempData == null)
            return apihelper.APIResponseOK(res, false, "Silahkan isi image",undefined);
        var resultImage = await UploadTemp.findByIdAndRemove(imageToken).exec();            
        data.image = resultImage.name;

        fs.rename(config.tempImageUploadPath + imageTempData.path, config.productCategoryImagePath + resultImage.name, function (err) {
            if (err) throw err
            console.log('Successfully renamed - AKA moved!')
        })


        data.created_at = moment().utc().toDate();        
        data.created_by = req.user;
        var result = await ProductCategory.create(data);
        var result1 = await UploadTemp.findByIdAndRemove(imageToken).exec();
    }


    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/", apihelper.authAccessOr({PRODUCTCATEGORY:config.action.Create}) ,dataFunc)

router.post("/", apihelper.authAccessOr({PRODUCTCATEGORY:config.action.Update}) ,dataFunc)

router.delete("/:id", apihelper.authAccessOr({PRODUCTCATEGORY:config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var result = await ProductCategory.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;