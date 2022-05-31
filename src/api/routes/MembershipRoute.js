const config = require('../config/config');
const router = require('express').Router();
const moment = require('moment');

const User = require('../models/User');
const Membership = require('../models/Membership')
const Hospital = require('../models/Hospital');

const apiHelper = require('../helper/APIHelper');
const strHelper = require('../helper/StringHelper');

router.get("/", apiHelper.authAccessOr({ MEMBERSHIP: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {};
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({ "membership_name": q });
        finalQuery["$or"].push({ "membership_nik": q });
        finalQuery["$or"].push({ "membership_email": q });
        finalQuery["$or"].push({ "membership_id": q });
    }

    var sort = { 'created_at': -1 };

    var result = await Membership.aggregate([
        { $match: finalQuery },
        {
            $lookup: {
                from: "OrderTransaction",
                localField: "member_transaction_id",
                foreignField: "_id",
                as: "ordeer_data"
            }
        },
        {
            $unwind: {
                "path": "$ordeer_data",
                "preserveNullAndEmptyArrays": true
            }
        },
        {
            $project: {
                '_id': 1,
                'membership_id':1,
                'member_nik':1,
                'member_name':1,
                'member_birthdate':1,
                'member_birthdate':1,
                'member_email':1,
                'member_address':1
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

router.get("/detail/:id", apiHelper.authAccessOr({ MEMBERSHIP: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = { _id: id }

    var data = await Membership.findOne(finalQuery).exec();
    if (apiHelper.isEmptyObj(data))
        return apiHelper.APIResponseNF(res, false, "Data tidak ditemukan", undefined);

    data.member_transaction_id = await Hospital.findOne({ _id: data.member_transaction_id }).exec();

    return apiHelper.APIResponseOK(res, true, undefined, data);
}))