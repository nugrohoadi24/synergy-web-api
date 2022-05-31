const config = require('../config/config');
const router = require('express').Router();
const UploadTemp = require('../models/UploadTemp');

const crypto = require("crypto");
const strHelper = require('../helper/StringHelper');
const apihelper = require('../helper/APIHelper');
const jwt = require('jsonwebtoken');
const moment = require('moment');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');
var path = require('path');
var pdf = require('html-pdf');
var mime = require('mime');

router.post("/upload/temp", apihelper.authAccessOr({
    PRODUCTCATEGORY:config.action.Create,
    PRODUCTCATEGORY:config.action.Update,
    VOUCHER:config.action.Create,
    VOUCHER:config.action.Update
}),apihelper.handleErrorAsync(async (req, res, next) => {

    var fstream;
    req.pipe(req.busboy);
    const {file} = req.query;
    req.busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
        var ext = path.extname(filename);
        ext = ext.toLowerCase();
        if(!(ext == '.jpg' || ext == '.jpeg' || ext == '.png' || ext=='.bmp')){
            return apihelper.APIResponseErr(res,false,"Gunakan file format jpg, jpeg, png atau bmp",null);
        }

        var fileAbsPath = moment().format('MMYYYY') +  "\\";
        if (!fs.existsSync(config.tempImageUploadPath  + fileAbsPath)){
            fs.mkdirSync(config.tempImageUploadPath + fileAbsPath);
        }

        var rndfileName = strHelper.generateRandom(120) + ext;
        fstream = fs.createWriteStream(config.tempImageUploadPath + fileAbsPath + rndfileName);
        file.pipe(fstream);
        fstream.on('close', async function () {    
            var stats = fs.statSync(config.tempImageUploadPath + fileAbsPath + rndfileName);

            var uploadTempData = {
                size:stats.size,
                name:rndfileName,
                mimetype:mimetype,
                path:fileAbsPath + rndfileName,
                created_at : moment().utc(),
                created_by : req.userId
            }
            var result = await UploadTemp.create(uploadTempData);

            return apihelper.APIResponseOK(res,true,"", {
                token:result._id
            });            
        });
    });
}))


router.post("/upload/cleaning",apihelper.authAccessOr({
    PRODUCTCATEGORY:config.action.View
}), apihelper.handleErrorAsync(async (req, res, next) => {

    var finalQuery = {}

    var data = await UploadTemp.find(finalQuery).exec();

    for (var index=0;index<data.length;index++) {
        var dataTemp = data[index];
        var fileAbsPath =  config.tempImageUploadPath  + dataTemp.path;                
        try{
            fs.unlinkSync(fileAbsPath);
            await UploadTemp.findByIdAndRemove(dataTemp._id).exec();
        } catch(e){                
            console.write(e);
        }
    }

    return apihelper.APIResponseOK(res,true,"",null);
}))





module.exports = router;