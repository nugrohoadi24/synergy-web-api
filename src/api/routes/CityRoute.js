const config = require('../config/config');
const router = require('express').Router();
const City = require('../models/City');
const apihelper = require('../helper/APIHelper');


router.get("/",apihelper.authAccessOr({MCITY:config.action.View}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var sort = { 'name': 1 };

    var result = await City.aggregate([
        { $match: finalQuery },
        {
            $lookup: {
                from: "province",
                localField: "province",
                foreignField: "code",
                as: "province"
            }
        },
        {
            $unwind: {
                "path": "$province",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id':1, 
                'code':1,
                'name':1,
                'province._id':1,
                'province.name':1, 
                'is_active':1, 
                'created_at':1, 
                'updated_at':1
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
        return apihelper.APIResponseOK(res, true, "Berhasil Mendapatkan list daftar kota",
            {
                docs: result[0].docs,
                page: page,
                pages: Math.ceil(totalCount / perpage),
                total: totalCount,
                limit: parseInt(perpage)
            });
    } else {
        return apihelper.APIResponseBR(res, false, "Gagal Mendapatkan Data", undefined);
    }
}))

router.get("/selection/",apihelper.authAccessOr({
    MCITY:config.action.View,
    MDISTRICT:config.action.View|config.action.Create|config.action.Update,
    MHOSPITAL:config.action.View|config.action.Create|config.action.Update,
    MUSER:config.action.View|config.action.Create|config.action.Update
    }),  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var finalQuery = {is_active:true}
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery = {name : q};
    }

    var result = City.paginate(finalQuery, { 
        select: "_id code name",
        page: page, 
        limit: parseInt(perpage)
    },
    ).then(data => {        
        return apihelper.APIResponseOK(res,true,"",data);
    });

}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    
    if(apihelper.isEmptyObj(data.province))
        return apihelper.APIResponseOK(res, false, "Silahkan isi provinsi",undefined);

    if(apihelper.isEmptyObj(data.code))
        return apihelper.APIResponseOK(res, false, "Silahkan kode kota",undefined);

    if(apihelper.isEmptyObj(data.name))
        return apihelper.APIResponseOK(res, false, "Silahkan nama kota",undefined);

    
    if(data._id) {
        var result = await City.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{
        var result = await City.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.post("/",apihelper.authAccessOr({MCITY:config.action.Update}), dataFunc)

router.put("/",apihelper.authAccessOr({MCITY:config.action.Create}), dataFunc)

router.delete("/:id",apihelper.authAccessOr({MCITY:config.action.Delete}),  apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await City.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))


module.exports = router;