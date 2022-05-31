const jwt = require('jsonwebtoken');
const config = require('../config/config');
const redis = require("redis");
const moment = require('moment');

exports.APIResponse = (isOk,message,data) => {
    return JSON.stringify({
        "is_ok":isOk,"message":message,"data":data
    });
}

exports.APIResponseOK = (res,isOk,message,data) => {
    res.status(200).contentType("application/json").send(this.APIResponse(isOk,message,data));
}

exports.APIResponseUnAuth = (res,isOk,message,data) => {
    res.status(401).contentType("application/json").send(this.APIResponse(isOk,message,data));
}

exports.APIResponseErr = (res,isOk,message,data) => {
    res.status(500).contentType("application/json").send(this.APIResponse(isOk,message,data));
}

exports.APIResponseNF = (res,isOk,message,data) => {
    res.status(404).contentType("application/json").send(this.APIResponse(isOk,message,data));
}

exports.APIResponseBR = (res,isOk,message,data) => {
    res.status(400).contentType("application/json").send(this.APIResponse(isOk,message,data));
}

exports.handleErrorAsync = func => (req, res, next) => {
    func(req, res, next).catch((error) => next(error));
};

exports.isEmptyObj = (obj) => {
    if(!Boolean(obj))
        return true;

    if(Array.isArray(obj)){
        if(obj.length == 0)
            return true;
    } else {
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                return false;
            }
        }    
    }
    return false;
};


exports.formatThousandGroup = (value) => {
    let val = (value/1).toFixed(0).replace('.', ',')
    return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}


const emailRegex = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;
exports.isEmailValid = (email) => {
    if (!email)
        return false;

    if(email.length>254)
        return false;

    var valid = emailRegex.test(email);
    if(!valid)
        return false;

    var parts = email.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
}

exports.cleanString = (data) => {
    if (Boolean(data)){
        return data.trim().replace("'","");
    }
}


exports.cleanUppercaseString = (data) => {
    if (Boolean(data)){
        return data.trim().replace("'","").toUpperCase();
    }
}

exports.uppercaseString = (data) => {
    if (Boolean(data)){
        return data.trim().toUpperCase();
    }
}


exports.formatUnitName = (value,period,unitName="") => {
    if(Boolean(value)){
        var periodName = "";
        if(period.toUpperCase() == 'YEAR')
            periodName = "TAHUN";
        else if(period.toUpperCase() == 'SEMESTER')
            periodName = "SEMESTER";
        else if(period.toUpperCase() == 'QUARTER')
            periodName = "3 BULAN"
        else if(period.toUpperCase() == 'MONTH')
            periodName = "BULAN";
        else if(period.toUpperCase() == 'DAY')
            periodName = "HARI";
        else if(period.toUpperCase() == 'CLAIM')
            periodName = "KLAIM";
        
     
      if(value == 'Unit')
          return unitName + "/" + periodName;
      else if (value == 'AsClaim')
        return " RUPIAH/TAHUN"
      else if (value == 'Rupiah')
        return " RUPIAH/" + periodName
      else if (value == 'Claim')
         return " KLAIM/" + periodName;

    }
    return "-";
  };


exports.romanize = (num) => {
    if (isNaN(num))
        return NaN;
    var digits = String(+num).split(""),
        key = ["","C","CC","CCC","CD","D","DC","DCC","DCCC","CM",
               "","X","XX","XXX","XL","L","LX","LXX","LXXX","XC",
               "","I","II","III","IV","V","VI","VII","VIII","IX"],
        roman = "",
        i = 3;
    while (i--)
        roman = (key[+digits.pop() + (i * 10)] || "") + roman;
    return Array(+digits.join("") + 1).join("M") + roman;
}


exports.getUTCRoman = () => {
    var now = moment().utc();
    return this.romanize(now.month()+1) + "/" + this.romanize(parseInt(now.year().toString().substring(2, 4)))
}

exports.getUTCYear = () => {
    var now = moment().utc();
    return this.romanize(now.month()+1) + "/" + parseInt(now.year().toString())
}

exports.getMonthYear = () => {
    var now = moment().utc();
    return this.paddingZero(now.month()+1,2) + parseInt(now.year().toString())
}

exports.paddingZero = (data,padCount) => {
    return data.toString().padStart(padCount,"0");
}


exports.isValidDate = (data) => {
    if (Object.prototype.toString.call(data) === "[object Date]") {
        if (isNaN(data.getTime())) {  // d.valueOf() could also work
            return false;
        } else {
            return true;
        }
    } else {
        return false;
    }
}



exports.sleep = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}   

exports.auth = (roles = []) => {
    return  (req, res, next) => {
            try {
                var token = "";
                if(req.headers.authorization!=null)
                    token =  req.headers.authorization.split(' ')[1];
                else
                    token = req.query.token;

                const decodedToken = jwt.verify(token, config.jwtsecret);
                if (!Boolean(decodedToken)) {
                    res.status(401).json({
                        "is_ok":false,
                        "message":"Invalid User/Access"
                    });
                } else {
                    if (roles.length && !roles.includes(decodedToken.role)) {
                        return res.status(401).json({
                            "is_ok":false,
                            "message":"Invalid roles"
                        });
                    }

                    req.user = {
                        _id: decodedToken.id,                        
                    };
                    req.userId = decodedToken.id;
                    req.userRole = decodedToken.role;
                    req.userName = decodedToken.name;
                    next();
                }
            } catch (ex) {
                
                res.status(401).json({
                    "is_ok":false,
                    "message":"Invalid User/Access"
                });
            }
        }
};


exports.authAccessOr = (neededAcess = {}) => {
    return  (req, res, next) => {
            try {
                var token = "";
                if(req.headers.authorization!=null)
                    token =  req.headers.authorization.split(' ')[1];
                else
                    token = req.query.token;

                const decodedToken = jwt.verify(token, config.jwtsecret);
                if (!Boolean(decodedToken)) {
                    res.status(401).json({
                        "is_ok":false,
                        "message":"Invalid User/Access"
                    });
                } else {
                    var isAuthorize = false;
                    for (const neededAcessKey in neededAcess){
                        if((decodedToken.access[neededAcessKey] & neededAcess[neededAcessKey]) > 0){
                            isAuthorize = true;
                        }
                    }
                    
                    if (!isAuthorize) {
                        return res.status(403).json({
                            "is_ok":false,
                            "message":"You don't have access to this function"
                        });
                    }

                    req.user = {
                        _id: decodedToken.id,                        
                    };
                    req.userId = decodedToken.id;
                    req.userRole = decodedToken.role;
                    req.userName = decodedToken.name;
                    next();
                }
            } catch (ex) {
                
                res.status(401).json({
                    "is_ok":false,
                    "message":"Invalid User/Access"
                });
            }
        }
};

exports.authAccessHR = () => {
    return  (req, res, next) => {
            try {
                var token = "";
                if(req.headers.authorization!=null)
                    token =  req.headers.authorization.split(' ')[1];
                else
                    token = req.query.token;

                const decodedToken = jwt.verify(token, config.jwtpublic);
                
                if (!Boolean(decodedToken)) {
                    res.status(401).json({
                        "is_ok":false,
                        "message":"Invalid User."
                    });
                } else {
                    req.user = {
                        _id: decodedToken.id,                        
                    };
                    req.hrId = decodedToken.userId;
                    req.name = decodedToken.name;
                    req.company = decodedToken.company;
                    req.email = decodedToken.email;
                    next();
                }
            } catch (ex) {
                res.status(401).json({
                    "is_ok":false,
                    "message":"Your Session Has Been Expired, Please Login Again."
                });
            }
        }
};


exports.authDocument = () => {
    return  (req, res, next) => {
            try {
                var token = "";
                if(req.headers.authorization!=null)
                    token =  req.headers.authorization.split(' ')[1];
                else
                    token = req.query.token;

                const decodedToken = jwt.verify(token, config.jwtsecret);
                if (!Boolean(decodedToken)) {
                    res.status(401).json({
                        "is_ok":false,
                        "message":"Invalid User/Access"
                    });
                } else {
                    next();
                }
            } catch (ex) {
                
                res.status(401).json({
                    "is_ok":false,
                    "message":"Invalid User/Access"
                });
            }
        }
};

exports.sendEmail = (toemail,subject,content,attachment) => {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        "host": "smtp.sg.aliyun.com",
        "port": 465,
        "secureConnection": true, // use SSL
        "auth": {
            "user": 'no-reply@salvushealth.id', // user name
            "pass": 'Salvusco123'         // password
        }
    });

    var htmlContent = "<head><style>html, body {color:#505050;font-size: 1em;}</style></head><body>" + content + "</body>"


    var mailOptions = {
        from: 'no-reply@salvushealth.id', // sender address mailfrom must be same with the user.
        to: toemail, // list of receivers
        cc:'cs@salvus.co.id, claim@salvushealth.id', // copy for receivers
        bcc:'', // secret copy for receivers
        subject: subject, // Subject line
        html: htmlContent, // html body
        attachments: attachment,
    };
    console.log(`Sending successfully to ` + toemail);
    // send mail with defined transport object
    return new Promise(function (resolve, reject){
        transporter.sendMail(mailOptions, (err, info) => {
           if (err) {
              console.log("error: ", err);
              reject(err);
           } else {
              console.log(`Mail sent successfully to ` + toemail);
              resolve(info);
           }
        });
     });
}


exports.sendEmailNocc = (toemail,subject,content,attachment) => {
    var nodemailer = require('nodemailer');
    var transporter = nodemailer.createTransport({
        "host": "smtp.sg.aliyun.com",
        "port": 465,
        "secureConnection": true, // use SSL
        "auth": {
            "user": 'no-reply@salvushealth.id', // user name
            "pass": 'Salvusco123'         // password
        }
    });

    var htmlContent = "<head><style>html, body {color:#505050;font-size: 1em;}</style></head><body>" + content + "</body>"


    var mailOptions = {
        from: 'no-reply@salvushealth.id', // sender address mailfrom must be same with the user.
        to: toemail, // list of receivers
        cc:'', // copy for receivers
        bcc:'', // secret copy for receivers
        subject: subject, // Subject line
        html: htmlContent, // html body
        attachments: attachment,
    };
    console.log(`Sending successfully to ` + toemail);
    // send mail with defined transport object
    return new Promise(function (resolve, reject){
        transporter.sendMail(mailOptions, (err, info) => {
           if (err) {
              console.log("error: ", err);
              reject(err);
           } else {
              console.log(`Mail sent successfully to ` + toemail);
              resolve(info);
           }
        });
     });
}

exports.convertToCron = (timestamp) => {
    var date=new Date(timestamp);

    const minutes = date.getMinutes();
    const hours = date.getHours();
    const days = date.getDate();
    const months = date.getMonth() + 1;
    const dayOfWeek = date.getDay();

    return `${minutes} ${hours} ${days} ${months} ${dayOfWeek}`
}

exports.sendPushNotification = (notification) => {
    const OneSignal = require('onesignal-node');
    
    // Set One Signal
    const client = new OneSignal.Client(config.onesignal_app_id, config.onesignal_api_key);

    // using async/await
    try {
        const response = client.createNotification(notification);
    } catch (e) {
        if (e instanceof OneSignal.HTTPError) {
            // When status code of HTTP response is not 2xx, HTTPError is thrown.
            console.log(e.statusCode);
            console.log(e.body);
        }
    }
}

exports.kFormatter = (num) => {
    return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
}