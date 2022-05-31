const config = require('../config/config')
const router = require('express').Router()
const moment = require('moment')
const fetch = require("node-fetch")

const apiHelper = require('../helper/APIHelper')
const stringHelper = require('../helper/StringHelper')


//Header nodefetch
const fetchHeader = {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from(`${config.xendit_secret_key}:""`, 'binary').toString('base64')
}

// Virtual Account Name
const nameVA = "Salvus Health"


router.get("/saldo", apiHelper.authAccessOr({ PAYMENTGATEWAY: config.action.View }), apiHelper.handleErrorAsync(async (req, res, next) => {

    var url = `${config.xendit_base_url}/balance`

    const request = await fetch(url, {
        method: 'get',
        headers: fetchHeader
    })
    const data = await request.json()

    return apiHelper.APIResponseOK(res, true, "Berhasil Mendapatkan Data Saldo", data);

}))



module.exports = router