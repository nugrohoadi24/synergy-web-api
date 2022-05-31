const config = require('../config/config');
const router = require('express').Router();
const ClaimLimitOptionSchema = require('../models/ClaimLimitOption');
const Diagnose = require('../models/Diagnose');
const apihelper = require('../helper/APIHelper');


const authM = apihelper.auth(['ADM',"CL"]);

router.get("/",authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }

    if(Boolean(searchquery)){
        var q = new RegExp(searchquery, 'i');
        finalQuery = {$or:[{code : q},{name : q}]};
    }

    var result = Diagnose.paginate(finalQuery, { 
        select: "_id code name is_active created_at updated_at",
        page: page, 
        limit: parseInt(perpage),
        lean: true,
        sort: sb 
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}));

router.get("/selection", 
apihelper.authAccessOr({
    CLAIM:config.action.View|config.action.Create|config.action.Update,
    CLAIMPROCESS:config.action.View|config.action.Create|config.action.Update
}), apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    var finalQuery = {is_active:true};

    if(Boolean(searchquery)){
        var q = new RegExp(searchquery, 'i');
        finalQuery = {$or:[{code : q},{name : q}]};
    }

    var result = Diagnose.paginate(finalQuery, { 
        select: "code name",
        page: Boolean(page)?parseInt(page):1, 
        limit: Boolean(perpage)?parseInt(perpage):10,
        sort: "code"
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))



router.put("/",authM, apihelper.handleErrorAsync(async (req, res, next) => {

    var data = req.body;    
    const Crypto = require('crypto');
    if(data._id) {
        var result = await Diagnose.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{ 
        var result = await Diagnose.create(data);
    }
    return apihelper.APIResponseOK(res, true,"",undefined);
}))

router.delete("/:id",authM, apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Diagnose.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;