const config = require('../config/config');
const router = require('express').Router();
const ClaimLimitOptionSchema = require('../models/ClaimLimitOption');
const Diagnose = require('../models/Diagnose');
const apihelper = require('../helper/APIHelper');


router.get("/claim_limit_option", apihelper.handleErrorAsync(async (req, res, next) => {

    var result = ClaimLimitOptionSchema.paginate({}, { 
        select: "key name valueType durationType",
        page: 1, 
        limit: 20,
        sort: "key"
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))



router.get("/diagnose", apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    var finalQuery = {is_active:true};

    if(Boolean(searchquery)){
        var q = new RegExp(searchquery, 'i');
        finalQuery = {$or:[{code : q},{name : q}]};
    }

    var result = Diagnose.paginate(finalQuery, { 
        select: "code name",
        page: Boolean(page)?page:1, 
        limit: Boolean(perpage)?perpage:10,
        sort: "code"
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))

module.exports = router;