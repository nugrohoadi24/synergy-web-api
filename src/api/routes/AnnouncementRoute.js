const config = require('../config/config');
const router = require('express').Router();
const Announcement = require('../models/Announcement');
const apihelper = require('../helper/APIHelper');
const moment = require('moment');
const schedule = require('node-schedule');

router.get("/", apihelper.authAccessOr({ ANNOUNCEMENT: config.action.View }), apihelper.handleErrorAsync(async (req, res, next) => {
    const { page, perpage, searchquery, sb, sd } = req.query;

    var finalQuery = {}
    if (searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery['$or'] = [];
        finalQuery['$or'].push({ title: q });
        finalQuery['$or'].push({ description: q });
        finalQuery['$or'].push({ short_description: q });
    }

    var result = Announcement.paginate(finalQuery, {
        select: "_id title type is_active short_description  description type show_at updated_at created_at",
        page: page,
        limit: parseInt(perpage),
        sort: sb
    },
    ).then(data => {
        return apihelper.APIResponseOK(res, true, "", data);
    });
}))


var updateFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    if (apihelper.isEmptyObj(data.title))
        return apihelper.APIResponseOK(res, false, "Silahkan isi title", undefined);

    if (apihelper.isEmptyObj(data.description))
        return apihelper.APIResponseOK(res, false, "Silahkan isi deskripsi", undefined);

    if (apihelper.isEmptyObj(data.short_description))
        return apihelper.APIResponseOK(res, false, "Silahkan isi deskripsi singkat", undefined);

    if (apihelper.isEmptyObj(data.type))
        return apihelper.APIResponseOK(res, false, "Silahkan isi tipe", undefined);

    if (apihelper.isEmptyObj(data.show_at))
        return apihelper.APIResponseOK(res, false, "Silahkan isi show_at", undefined);

    if (data._id) {
        var prevData = await Announcement.findOne({ _id: data._id }).exec();
        if (moment(prevData.show_at).isBefore(new moment().utc())) {
            return apihelper.APIResponseOK(res, false, "Tidak dapat mengedit data yg show at nya telah lewat", undefined);
        }

        data.updated_by = req.user;
        data.updated_at = moment().utc().toDate();
        var result = await Announcement.findByIdAndUpdate({ _id: data._id }, data, {
            upsert: true
        }).exec();
    } else {
        var cron = apihelper.convertToCron(data.show_at)
        var currentdate = new Date(moment().utc().toDate())
        var date = new Date(data.show_at);

        var showAt = date.getDate()
        var currentTime = currentdate.getDate()

        const notification = {
            headings: {
                'en': data.title
            },
            contents: {
                'en': data.short_description
            },
            big_picture: "https://media.istockphoto.com/vectors/latest-news-update-medical-breaking-information-happy-doctors-alert-vector-id1280785953?b=1&k=6&m=1280785953&s=170667a&w=0&h=H5r_WxPlYPDsCmEgslsFk5zVynTHRCOtkJO13_HkQ6w=",
            included_segments: ['Staging'],
        };
        if (showAt == currentTime) {
            apihelper.sendPushNotification(notification)
        } else {
            const job = schedule.scheduleJob(cron, function () {
                var cron = apihelper.convertToCron(data.show_at)
                var currentdate = new Date(moment().utc().toDate())
                var date = new Date(data.show_at);

                var showAt = date.getDate()
                var currentTime = currentdate.getDate()

                const notification = {
                    headings: {
                        'en': data.title
                    },
                    contents: {
                        'en': data.short_description
                    },
                    big_picture: "https://media.istockphoto.com/vectors/latest-news-update-medical-breaking-information-happy-doctors-alert-vector-id1280785953?b=1&k=6&m=1280785953&s=170667a&w=0&h=H5r_WxPlYPDsCmEgslsFk5zVynTHRCOtkJO13_HkQ6w=",
                    included_segments: ['Staging'],
                };
                apihelper.sendPushNotification(notification)
            });
        }

        data.created_at = moment().utc().toDate();
        data.created_by = req.user;
        var result = await Announcement.create(data);
    }

    return apihelper.APIResponseOK(res, true, "", undefined);
})

router.put("/", apihelper.authAccessOr({ ANNOUNCEMENT: config.action.Create }), updateFunc)

router.post("/", apihelper.authAccessOr({ ANNOUNCEMENT: config.action.Update }), updateFunc)

router.delete("/:id", apihelper.authAccessOr({ ANNOUNCEMENT: config.action.Delete }), apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var result = await Announcement.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true, "Pemberitahuan Ini Telah Dihapus", undefined);
}))


module.exports = router;