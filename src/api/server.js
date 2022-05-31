require('dotenv').config()

const cluster = require('cluster')
const os = require('os')
const https = require('https');

const apihelper = require('./helper/APIHelper');
const config = require('./config/config.js');
const redis = require("redis");
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');

var busboy = require('connect-busboy')
var session = require('express-session');
var morgan = require('morgan')
var serveStatic = require('serve-static');

const schedule = require('node-schedule');
const moment = require('moment');
const AWS = require("aws-sdk");
const fs = require('fs');


const allowCrossDomain = function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', '*');
    res.header('Access-Control-Allow-Headers', '*');
    next();
}


const ca = [
    fs.readFileSync(config.sslkeypath + "ChainCA1.crt"),
    fs.readFileSync(config.sslkeypath + "ChainCA2.crt"),
];
const sslconfig = {
    key: fs.readFileSync(config.sslkeypath + 'private.txt'),
    cert: fs.readFileSync(config.sslkeypath + 'synergy_salvushealth_id.crt'),
    ca: ca
};

const sslconfig1 = {
    key: fs.readFileSync(config.sslkeypath + 'key.pem'),
    cert: fs.readFileSync(config.sslkeypath + 'cert.pem'),
};

const options = {
    loggerLevel: 'info',
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    autoIndex: false, // Don't build indexes
    poolSize: 10, // Maintain up to 10 socket connections
    socketTimeoutMS: 5000, // Close sockets after 45 seconds of inactivity
    connectTimeoutMS: 5000,
    family: 4 // Use IPv4, skip trying IPv6
};

const mongoose = require('mongoose');
mongoose.set('debug', true);
mongoose.set('bufferCommands', false);
mongoose.pluralize(null);
//mongoose.set('maxTimeMS', 5000);
mongoose.Promise = global.Promise;


// koneksi Ke Database
mongoose.connect(config.url, options)
    .then(() => {
        console.log("Successfully Sekarang Anda Terkonek Ke database");
    }).catch(err => {
        console.log('Error database Tidak Terkoneksi atau Tidak Ada');
    });

mongoose.connection.on('open', function (ref) {
    console.log('Connected to mongo server.');
})

mongoose.connection.on('connected', function (ref) {
    console.log('Connected to mongo server.');
})
mongoose.connection.on('disconnected', function (ref) {
    console.log('disconnected to mongo server.');
})

mongoose.connection.on('error', function (err) {
    console.log(err);
});

// If the Node process ends, close the Mongoose connection 
process.on('SIGINT', function () {
    mongoose.connection.close(function () {
        console.log('Mongoose default connection disconnected through app      termination');
        process.exit(0);
    });
})

// check if the process is the master process
if (cluster.isMaster) {
    // get the number of available cpu cores 
    //const nCPUs = os.cpus().length;
    // fork worker processes for each available CPU core
    const nCPUs = 2;
    for (let i = 0; i < nCPUs; i++) {
        cluster.fork()
    }

    cluster.on('exit', (worker, code, signal) => {
        cluster.fork(); // on dying worker, respawn
    });


    spawn = require('child_process').spawn;
    const spacesEndpoint = new AWS.Endpoint(config.spaceEndpoint);
    //const s3 = new AWS.S3({endpoint: spacesEndpoint, accessKeyId: config.spaceAccessKey, secretAccessKey: config.spaceSecret});

    //const job = schedule.scheduleJob('0 */3 * * *', function(){
    /*var tmpDate = moment().format('YYYY_MM_DD_HH_mm_ss');
    var fileBackupKey = 'salvusbackup_'+ tmpDate +'.gz';
    var fileBackupPath = config.backupPath +  fileBackupKey
    
    let backupProcess = spawn('mongodump', [
        '--uri=' + config.url,
        '--archive=' + fileBackupPath,
        '--gzip'
        ]);
    
    backupProcess.on('exit', (code, signal) => {
        if(code) 
            console.log('Backup process exited with code ', code);
        else if (signal)
            console.error('Backup process was killed with singal ', signal);
        else {
            const file = fs.readFileSync(fileBackupPath);
            s3.upload({Bucket: "synergy", Key: fileBackupKey, Body: file, ACL: "public-read"}, (err, data) => {
                if (err) return console.log(err);
                console.log("Your file has been uploaded successfully!", data);
                fs.unlinkSync(fileBackupPath);
            }); 
        }
    });
    
 
    console.log('The answer to life, the universe, and everything!');
});*/


} else {
    const app = express();
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    app.use(session({
        secret: config.sessionSecret, resave: true,
        saveUninitialized: true
    }));

    app.use(allowCrossDomain)
    app.use(cors())
    app.use(busboy());
    app.use(morgan('tiny'))

    app.use(serveStatic(config.cms_static_url))

    app.use('/document', apihelper.authDocument(), express.static(config.uploadTempPath, { maxAge: 3000 }))
    app.use('/hr_doc', apihelper.authAccessHR(), express.static(config.uploadTempPath, { maxAge: 3000 }))
    app.use('/asset', express.static(config.assetTempPath, { maxAge: 3000 }))

    app.use('/term', express.static(config.uploadTempPath + "/term.html"))
    app.use('/privacy', express.static(config.uploadTempPath + "/privacy.html"))

    var UserRoute = require('./routes/UserRoute')
    app.use('/user', UserRoute)

    var AdminRoute = require('./routes/AdminRoute')
    app.use('/admin', AdminRoute)

    var RoleRoute = require('./routes/RoleRoute')
    app.use('/role', RoleRoute)

    var CompanyRoute = require('./routes/CompanyRoute')
    app.use('/company', CompanyRoute)

    var ProvinceRoute = require('./routes/ProvinceRoute')
    app.use('/province', ProvinceRoute)

    var CityRoute = require('./routes/CityRoute')
    app.use('/city', CityRoute)

    var DistrictRoute = require('./routes/DistrictRoute')
    app.use('/district', DistrictRoute)

    var SubdistrictRoute = require('./routes/SubdistrictRoute')
    app.use('/subdistrict', SubdistrictRoute)

    var HospitalRoute = require('./routes/HospitalRoute')
    app.use('/hospital', HospitalRoute)

    var InsuranceProductRoute = require('./routes/InsuranceProductRoute')
    app.use('/insurance_product', InsuranceProductRoute)

    var ImportUserRoute = require('./routes/ImportUserRoute')
    app.use('/import_user', ImportUserRoute)

    var ImportUserPolicyRoute = require('./routes/ImportUserPolicyRoute')
    app.use('/import_user_policy', ImportUserPolicyRoute)

    var UserPolicyRoute = require('./routes/UserPolicyRoute')
    app.use('/user_policy', UserPolicyRoute)

    var DataRoute = require('./routes/DataRoute')
    app.use('/data', DataRoute)

    var ClaimRoute = require('./routes/ClaimRoute')
    app.use('/claim', ClaimRoute)

    var DiagnoseRoute = require('./routes/DiagnoseRoute')
    app.use('/diagnose', DiagnoseRoute)

    var ClaimClosureRoute = require('./routes/ClaimClosureRoute')
    app.use('/claim_closure', ClaimClosureRoute)

    var CompanyPolicyRoute = require('./routes/CompanyPolicyRoute')
    app.use('/company_policy', CompanyPolicyRoute)

    var ReportRoute = require('./routes/ReportRoute')
    app.use('/report', ReportRoute)

    var AnnouncementRoute = require('./routes/AnnouncementRoute')
    app.use('/announcement', AnnouncementRoute)

    var MobileRoute = require('./routes/MobileRoute')
    app.use('/mb', MobileRoute)

    var UploadImageRoute = require('./routes/UploadImageRoute')
    app.use('/image', UploadImageRoute)

    var ProductCategoryRoute = require('./routes/ProductCategoryRoute')
    app.use('/product/category', ProductCategoryRoute)

    var VoucherRoute = require('./routes/VoucherRoute')
    app.use('/voucher', VoucherRoute)

    var VoucherRoute = require('./routes/ImportVoucherWalletRoute')
    app.use('/import_voucher', VoucherRoute)

    var ProductCategoryRoute = require('./routes/ProductCategoryRoute')
    app.use('/category', ProductCategoryRoute)

    var StoreTransactionRoute = require('./routes/StoreTransactionRoute')
    app.use('/store', StoreTransactionRoute)

    var CompanyPolicyDepositRoute = require('./routes/CompanyPolicyDepositRoute')
    app.use('/deposit', CompanyPolicyDepositRoute)

    var ImportProviderRoute = require('./routes/ImportProviderRoute')
    app.use('/import_provider', ImportProviderRoute)

    var LogCostumerServiceRoute = require('./routes/LogCostumerServiceRoute')
    app.use('/log_costumer_service', LogCostumerServiceRoute)

    var DigitalForm = require('./routes/DigitalFormRoute')
    app.use('/digital_form', DigitalForm)

    var PaymentGateway = require('./routes/PaymentGatewayRoutes')
    app.use('/payment_gateway', PaymentGateway)

    var HumenResource = require('./routes/HumanResourceRoutes')
    app.use('/human_resource', HumenResource)

    function errorHandler(err, req, res, next) {
        console.error(err.stack)
        apihelper.APIResponseErr(res, false, err.toString(), null);
    }

    function clientErrorHandler(err, req, res, next) {
        if (req.xhr) {
            console.error(err.stack)
            apihelper.APIResponseErr(res, false, err.toString(), null);
        } else {
            next(err)
        }
    }

    function logErrors(err, req, res, next) {
        apihelper.APIResponseErr(res, false, err.toString(), null);
        console.error(err.stack)
        next(err)
    }

    app.use(errorHandler);
    app.use(clientErrorHandler);
    app.use(logErrors);

    app.listen(3000, () => {
        console.log("Server is listening on port 3000");
    });

    /*var httpsServer1 = https.createServer(sslconfig1,app)
    httpsServer1.listen(2342,() => {
        console.log("Server is listening on port 2342");
    });

    var httpsServer = https.createServer(sslconfig,app)
    httpsServer.listen(443,() => {
        console.log("Server is listening on port 443");
    });*/
}

