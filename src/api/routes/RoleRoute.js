const config = require('../config/config');
const router = require('express').Router();
const Role = require('../models/Role');
const Admin = require('../models/Admin');
const apihelper = require('../helper/APIHelper');
var ObjectID = require('mongodb').ObjectID;
const moment = require('moment');

const authM = apihelper.auth(['ADM',"CL"]);

router.get("/",apihelper.authAccessOr({MROLE:config.action.View}), apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = {}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = Role.paginate(finalQuery, { 
        page: page, 
        limit: parseInt(perpage),
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))


router.get("/detail/:id",apihelper.authAccessOr({MROLE:config.action.View}), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}
    var data = await Role.findOne(finalQuery,"_id name code access").lean().exec();

    if(apihelper.isEmptyObj(data))
        return apihelper.APIResponseOK(res, false,"Data tidak di temukan",undefined);

    data.accessList = [];    

    for(var accessKey in config.accessList){
        var accessName = config.accessList[accessKey];
        var tmp = {};
        tmp.code = accessKey;
        tmp.name = accessName;

        for(var keyAction in config.action){
            var actionCode = config.action[keyAction];   

            if(Boolean(data.access)){
                tmp[keyAction] = ((data.access[accessKey] & actionCode) == actionCode);
            }else{
                tmp[keyAction] = false;
            }
        }

        data.accessList.push(tmp);
    }

    data.actionList = [];
    for(var keyAction in config.action){
        data.actionList.push({
            name : keyAction,
            code : config.action[keyAction]
        });
    }

    data.access = undefined;

    return apihelper.APIResponseOK(res,true,"",data);
}))


router.get("/accessList",apihelper.authAccessOr({MROLE:config.action.View}), apihelper.handleErrorAsync(async (req, res, next) => {
    var data = {};
    data.accessList = [];
    for(var accessKey in config.accessList){
        var accessName = config.accessList[accessKey];
        var tmp = {};
        tmp.code = accessKey;
        tmp.name = accessName;

        for(var keyAction in config.action){
            var actionCode = config.action[keyAction];   

            if(Boolean(data.access)){
                tmp[keyAction] = ((data.access[accessKey] & actionCode) == actionCode);
            }else{
                tmp[keyAction] = false;
            }
        }

        data.accessList.push(tmp);
    }

    data.actionList = [];
    for(var keyAction in config.action){
        data.actionList.push({
            name : keyAction,
            code : config.action[keyAction]
        });
    }

    return apihelper.APIResponseOK(res,true,"",data);
}))

router.get("/selection",apihelper.authAccessOr({
    MROLE:config.action.View,
    MADMIN:config.action.View|config.action.Create|config.action.Update
}), apihelper.handleErrorAsync(async (req, res, next) => {
    const {searchquery} = req.query;
    
    var result = Role.paginate({}, { 
        select: "_id code name",
        sort: "name",
        page: 1, 
        limit: 100
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;


    var saveData = {
        code : data.code,
        name : data.name,
        access : {}
    }

    if(Boolean(data.accessList)){
        for(var key in data.accessList){
            var dataTemp = data.accessList[key];
            saveData.access[dataTemp.code] = 0;

            for(var keyAction in config.action){
                var actionCode = config.action[keyAction];   

                if(dataTemp[keyAction])
                    saveData.access[dataTemp.code] = saveData.access[dataTemp.code] | actionCode;
            }

        }
    }

    if(data._id) {   
        saveData.updated_by = req.user;
        saveData.updated_at = moment().utc().toDate();        

        var result = await Role.findByIdAndUpdate({_id:data._id}, saveData,{
            upsert:true,
        }).exec();        
    }else{
        saveData.created_by = req.user;
        saveData.created_at = moment().utc().toDate();        
        var result = await Role.create(saveData);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/",apihelper.authAccessOr({MROLE:config.action.Create}),dataFunc)

router.post("/",apihelper.authAccessOr({MROLE:config.action.Update}),dataFunc)


router.delete("/:id",apihelper.authAccessOr({MROLE:config.action.Delete}), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var check = await Admin.findOne({role: ObjectID(id)}).exec();
    if(check !=null)
        return apihelper.APIResponseOK(res, false,"Role ini telah di gunakan, tidak dapat di delete",undefined);

    var result = await Role.findByIdAndRemove(id).exec();

    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;