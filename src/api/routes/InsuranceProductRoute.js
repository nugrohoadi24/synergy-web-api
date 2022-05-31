const config = require('../config/config');
const router = require('express').Router();
const InsuranceProduct = require('../models/InsuranceProduct');
const apihelper = require('../helper/APIHelper');


const authM = apihelper.auth(['ADM',"CL"]);

router.get("/", apihelper.authAccessOr({MINSPRODUCT:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({name : q});
        finalQuery["$or"].push({code : q});
        finalQuery["$or"].push({type : q});
    }

    var sortSpec = {name:1};
    if(Boolean(sb)){
        if(sb[0]=='-'){
            sortSpec = {[sb.substring(1)]:-1}
        }else{
            sortSpec = {[sb]:1}
        }
    }

    var result = await InsuranceProduct.aggregate([
        {$match : finalQuery},
        {
            $project: {
               code:1,
               name:1,
               type:1,
               is_active:1,
               excess_dijamin: { $cond: { if: {$eq:["$excess_dijamin",true]}, then: "DIJAMIN", else: "TIDAK DIJAMIN"}},
               plan_count:{ $size: "$benefit_year_limit"},
               jenis_produk: { $cond: { if: {$eq:["$product_type", "1"]}, then: "SALVUSCARE", else: "INSURANCE CLAIM"}},
            }
        },
        { $sort: sortSpec},
        {
            $facet: {
                docs: [{ $skip: (parseInt(page)-1) * parseInt(perpage) }, { $limit: parseInt(perpage) }],
                totalCount: [{
                    $count: 'count'
                }]
            }
        }
    ]).exec();

    if(result != null && result.length > 0){        
        var totalCount = 0;
        if(Boolean(result[0].totalCount) && result[0].totalCount.length > 0)
            totalCount = result[0].totalCount[0].count;
        
        return apihelper.APIResponseOK(res,true,"",{
            page:page,
            pages:Math.ceil(totalCount/perpage),
            total:totalCount,
            limit:perpage,
            docs:result[0].docs
        });    
    }else {
        return apihelper.APIResponseOK(res,true,"",undefined);
    }
}))

router.get("/selection/", apihelper.authAccessOr({
    MINSPRODUCT:config.action.View,
    MPARTICIPANT:config.action.View|config.action.Create|config.action.Update
})  ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var finalQuery = {is_active:true}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = InsuranceProduct.paginate(finalQuery, { 
        select: "_id code name product_type",
        page: page, 
        limit: parseInt(perpage)
    }).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });
}))

router.get("/plan/selection/", apihelper.authAccessOr({
    MINSPRODUCT:config.action.View,
    MPARTICIPANT:config.action.View|config.action.Create|config.action.Update
    }) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {searchquery,productId} = req.query;
    
    var finalQuery = {is_active:true}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var dataProduct = await InsuranceProduct.findOne({_id:productId});
    if(dataProduct){

    }
    var plans = dataProduct.benefit_year_limit.map(x=> {
        return {
            plan_name:x.plan_name
        }
    }),
    data = {
        docs: plans,
        total: plans.length ,
        limit: 10,
        page: 1,
        pages: 1
    }
    return apihelper.APIResponseOK(res,true,"",data);
}))

router.get("/detail/:id", apihelper.authAccessOr({MINSPRODUCT:config.action.View})  , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}

    var result = InsuranceProduct.paginate(finalQuery, { 
        select: "",
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data.docs[0]);
    });
}))

router.get("/detail/:id/:planName", apihelper.authAccessOr({MINSPRODUCT:config.action.View})  , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    const planName = req.params.planName;

    var finalQuery = {_id:id}


    var result = await InsuranceProduct.findOne(finalQuery).lean(true).exec();

    if(result != null){
        for(var x=0;x< result.benefit.length;x++){
            var tmp = result.benefit[x].plan.find(y => y.plan_name == planName);
            if(Boolean(tmp)) {
                result.benefit[x].plan = tmp;
            }
            else
                result.benefit[x].plan = undefined;

        }
        result.benefit_year_limit = result.benefit_year_limit.find(x=> x.plan_name = planName);
    }
    apihelper.APIResponseOK(res,true,"",result);
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {

    var data = req.body;

    if(!Boolean(data))
        return apihelper.APIResponseOK(res, false,"Silahkan masukan data",undefined);

    if(!Boolean(data.type))
        return apihelper.APIResponseOK(res, false,"Silahkan masukan type product",undefined);
        
    if(!Boolean(data.code))
        return apihelper.APIResponseOK(res, false,"Silahkan kode product",undefined);

    if(!Boolean(data.name))
        return apihelper.APIResponseOK(res, false,"Silahkan nama product",undefined);

    if(!Boolean(data.benefit) && data.benefit.count()>0)
        return apihelper.APIResponseOK(res, false,"Silahkan masukan data benefit",undefined);

    if(!Boolean(data.benefit_year_limit) && data.benefit_year_limit.count > 0)
        return apihelper.APIResponseOK(res, false,"Silahkan masukan data limit benefit",undefined);

    if(!Boolean(data.benefit_year_limit) || data.benefit_year_limit.count == 0)
        return apihelper.APIResponseOK(res, false,"Silahkan masukan data plan",undefined);

    data.benefit_year_limit.forEach(benefitYearItem => {
        if(!Boolean(benefitYearItem.plan_name))
            return apihelper.APIResponseOK(res, false,"Silahkan masukan plan name",undefined);
    });


    var planCount = data.benefit_year_limit.count;

    data.benefit.forEach(benefitItem => {
        if(!Boolean(benefitItem.name))
            return apihelper.APIResponseOK(res, false,"Silahkan masukan nama benefit",undefined);

        if(benefitItem.is_group){
            benefitItem.unit = "";
            benefitItem.plan = [];            
        }else {
            if(!Boolean(benefitItem.unit))
                return apihelper.APIResponseOK(res, false,"Silahkan masukan unit benefit",undefined);

            if(planCount != benefitItem.plan.count)
                return apihelper.APIResponseOK(res, false,"Plan benefit tidak sama jumlahnya dengan plan tahunan",undefined);

            benefitItem.plan.forEach(planitem => {
                if(!Boolean(planitem.plan_name))
                    return apihelper.APIResponseOK(res, false,"Silahkan masukan nama plan untuk benefit " + benefitItem.name,undefined);
                
                if(planitem.limit1Type == "0" || planitem.limit1Type == "99")
                    planitem.limit1 = 0;
                else {                    
                    if(!(Boolean(planitem.limit1) && Boolean(planitem.limit1Type)))
                        return apihelper.APIResponseOK(res, false,"Silahkan masukan parameter limit 1 untuk benefit '" + benefitItem.name + "' plan " + planitem.plan_name ,undefined);
                }

                if(planitem.limit2Type == "0" || planitem.limit2Type == "99")
                    planitem.limit2 = 0;
                else {                                    
                    if((!Boolean(planitem.limit2) && Boolean(planitem.limit2Type)) || (!Boolean(planitem.limit2) && Boolean(planitem.limit2Type)) )
                        return apihelper.APIResponseOK(res, false,"Silahkan masukan parameter limit 2 untuk benefit '" + benefitItem.name + "' plan " + planitem.plan_name ,undefined);
                }
            });            
        }
    });

    if(data._id) {
        var result = await InsuranceProduct.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{
        var result = await InsuranceProduct.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/", apihelper.authAccessOr({MINSPRODUCT:config.action.Create}) ,dataFunc )

router.post("/", apihelper.authAccessOr({MINSPRODUCT:config.action.Update}) ,dataFunc )

router.delete("/:id", apihelper.authAccessOr({MINSPRODUCT:config.action.Delete}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await InsuranceProduct.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;