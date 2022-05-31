const config = require('../config/config');
const router = require('express').Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const UserPolicy = require('../models/UserPolicy');
const CompanyPolicy = require('../models/CompanyPolicy');
const InsuranceProduct = require('../models/InsuranceProduct');
const ClaimLimitOptionSchema = require('../models/ClaimLimitOption');
var ObjectID = require('mongodb').ObjectID;
const moment = require('moment');

const apihelper = require('../helper/APIHelper');


router.get("/", apihelper.authAccessOr({MPARTICIPANT:config.action.View}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery,sb,sd} = req.query;
    
    var finalQuery = { }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({certificate_no : q});
        finalQuery["$or"].push({company_policy : q});
        finalQuery["$or"].push({card_no : q});
        finalQuery["$or"].push({nama_tertanggung : q});
        finalQuery["$or"].push({nik_tertanggung : q});
        finalQuery["$or"].push({"user.nama" : q});

        var vdate = ""
        try{
            vdate = moment.utc(searchquery,"DD/MM/YYYY").toDate()
            if(apihelper.isValidDate(vdate))
                finalQuery["$or"].push({dob_tertanggung : vdate});
        }catch(e){

        }
    }

    var result = await UserPolicy.aggregate([
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user"
        }}, 
        {$unwind:"$user"},
        {$match : finalQuery},
        {$lookup: { 
            from: "insurance_product",
            localField:"insurance_product",
            foreignField:"_id",
            as:"insurance_product"
        }}, 
        {$unwind:"$insurance_product"},
        { $project: {'is_active':1,'certificate_no':1,'nama_tertanggung':1,'policy_date':1,'policy_end_date':1,'dob_tertanggung':1,
                        'plan_name':1,'card_no':1,'created_at':1,'updated_at':1,'company_policy':1,
                        'user._id':1,'user.nama':1,'user.email':1,
                        'insurance_product._id':1,'insurance_product.code':1,'insurance_product.name':1, 'insurance_product.product_type':1,
        }},
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

        for(var key in result[0].docs){
            var tempData = result[0].docs[key];
            var dt1 = moment(tempData.policy_date).startOf('day');
            var dt2 = moment(tempData.policy_end_date).startOf('day');
            var currentDt = moment().startOf('day');

            if(tempData.is_active){
                if(currentDt.isAfter(dt2) || currentDt.isBefore(dt1)){
                    tempData.status_polis = "EXPIRED";
                }else {
                    tempData.status_polis = "ACTIVE";
                }
            }else{
                tempData.status_polis = "NON-ACTIVE";
            }
        }

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

router.get("/detail/:id", apihelper.authAccessOr({MPARTICIPANT:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;

    var finalQuery = {_id:id}
    var policyData = await UserPolicy.findOne(finalQuery).lean().exec();

    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res, false,"Data tidak di temukan",undefined);

    var resultUser =await User.findOne({_id:policyData.user},'_id nama company email handphone').lean().exec();
    var resultProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product},'_id code name').lean().exec();


    resultUser.userDesc = resultUser.nama;
    if(Boolean(resultUser.email)) {
        resultUser.userDesc += " / " + resultUser.email
    }

    if(Boolean(resultUser.handphone))
    resultUser.userDesc += " / " + resultUser.handphone 


    if(Boolean(policyData.updated_by))
        policyData.updated_by = await Admin.findByIdAndUpdate({_id: policyData.updated_by},"_id name").exec();

    if(Boolean(policyData.created_by))
        policyData.created_by = await Admin.findByIdAndUpdate({_id: policyData.created_by},"_id name").exec();

    var dt1 = moment(policyData.policy_date).startOf('day');
    var dt2 = moment(policyData.policy_end_date).startOf('day');
    var currentDt = moment().startOf('day');

    if(policyData.is_active){
        if(currentDt.isAfter(dt2) || currentDt.isBefore(dt1)){
            policyData.status_polis = "EXPIRED";
        }else {
            policyData.status_polis = "ACTIVE";
        }
    }else{
        policyData.status_polis = "NON-ACTIVE";
    }

    policyData.user = resultUser;
    policyData.insurance_product = resultProduct;
    return apihelper.APIResponseOK(res,true,"",policyData);

}))

router.get("/detail/claim/:id", apihelper.authAccessOr({
    MPARTICIPANT:config.action.View,
    CLAIM:config.action.View|config.action.Create|config.action.Update,
    CLAIMPROCESS:config.action.View|config.action.Create|config.action.Update
}) , apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;


    var finalQuery = {_id:id}
    var policyData = await UserPolicy.findOne(finalQuery,'_id user certificate_no nama_tertanggung nik_tertanggung alamat_tertanggung policy_date policy_end_date insurance_product benefit_usage plan_name product_type yearly_usage created_at ').lean().exec();
    if(apihelper.isEmptyObj(policyData))
        return apihelper.APIResponseOK(res,false,"Silahkan cek kembali data polis claim ini, polis tidak di temukan",null);


    var resultUser =await User.findOne({_id:policyData.user},'_id nama').lean().exec();
    var resultProduct = await InsuranceProduct.findOne({_id:policyData.insurance_product},'_id code name benefit benefit_year_limit ').lean().exec();
    var satuan_limit_data = await ClaimLimitOptionSchema.find().exec();

    policyData.user = resultUser;

    var currentDate = moment().startOf('day').utc().toDate();

    if(Boolean(resultProduct)){
        policyData.benefit_year_limit = resultProduct.benefit_year_limit.find(xs => xs.plan_name == policyData.plan_name);
        if(apihelper.isEmptyObj(policyData.yearly_usage))
            policyData.yearly_usage = 0;

        policyData.policy_benefit_detail = [];

        for (var x = 0;x< resultProduct.benefit.length;x++){
            var benefit = resultProduct.benefit[x];
            benefit.plan =  benefit.plan.find(y => y.plan_name == policyData.plan_name);

            benefit.usage1 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null,
            };
            benefit.usage2 = {
                value:null,
                availableValue:null,
                limitValue:null,
                valueType:null,
                durationType:null
            };

            if(!Boolean(benefit.is_group)){
                //isi benefit usage

                // if(benefit._id.toString() == '607470c025fa4501c87b0f7d'){
                //     console.log('a');
                // }
    
                benefit.unit_price_limit = benefit.plan.unit_price_limit;
                benefit.unit_name = benefit.unit_name;            
    
                if(Boolean(policyData.benefit_usage)){                    
                    var benefitUsage = policyData.benefit_usage.find(us => us.benefit.toString()== benefit._id.toString() );

                    if(Boolean(benefitUsage)){                     
                        var tmp = benefitUsage.usage1.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate);
                        if(!apihelper.isEmptyObj(tmp)){                            
                            benefit.usage1.valueType = tmp.usage_valueType;
                            benefit.usage1.durationType = tmp.usage_durationType;

                            if(benefit.usage1.valueType == config.limit_value_type.Unit)
                                benefit.usage1.value = tmp.usage_jlh;
                            else if (benefit.usage1.valueType == config.limit_value_type.Amount)
                                benefit.usage1.value = tmp.usage_amount;
                            else if (benefit.usage1.valueType == config.limit_value_type.Claim)
                                benefit.usage1.value = 1;
                            else if (benefit.usage1.valueType == config.limit_value_type.AsClaim)
                                benefit.usage1.value = tmp.usage_amount;
                        }

                        var tmp2 = benefitUsage.usage2.find(xs => moment(xs.period_start) <= currentDate && moment(xs.period_end) >= currentDate)
                        if(!apihelper.isEmptyObj(tmp2)){
                            benefit.usage2.valueType = tmp2.usage_valueType;
                            benefit.usage2.durationType = tmp2.usage_durationType;                            

                            if(benefit.usage2.valueType == config.limit_value_type.Unit)
                                benefit.usage2.value = tmp2.usage_jlh;
                            else if (benefit.usage2.valueType == config.limit_value_type.Amount)
                                benefit.usage2.value = tmp2.usage_amount;
                            else if (benefit.usage2.valueType == config.limit_value_type.Claim)
                                benefit.usage2.value = 1;
                            else if (benefit.usage2.valueType == config.limit_value_type.AsClaim)
                                benefit.usage2.value = tmp2.usage_amount;
                        }
                    }
                }

                var limitText = [];
                if(benefit.unit == "2" && Boolean(benefit.plan.unit_price_limit)){
                    limitText.push("limit per " + benefit.unit_name + " = " +  apihelper.formatThousandGroup(benefit.plan.unit_price_limit)); 
                }

                if(benefit.plan.limit1Type == "99" || benefit.plan.limit2Type == "99"){
                    limitText.push("Not Available"); 
                    benefit.usage1.availableValue = null;
                } else {
                    var telahAdaUnlimited = false;
                    var limit1 = satuan_limit_data.find(s=> s.key == benefit.plan.limit1Type);

                    if(Boolean(limit1)){
                        benefit.usage1.valueType = limit1.valueType;
                        benefit.usage1.durationType = limit1.durationType;
                        if(limit1.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            benefit.usage1.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                            benefit.usage1.limitValue = policyData.benefit_year_limit.limit;
                            telahAdaUnlimited = true;
                        }else{
                            benefit.usage1.availableValue = benefit.plan.limit1 - benefit.usage1.value;
                            benefit.usage1.limitValue = benefit.plan.limit1;

                            limitText.push(apihelper.formatThousandGroup(benefit.plan.limit1) + " " + apihelper.formatUnitName(limit1.valueType,limit1.durationType,benefit.unit_name));                             
                            // if(limit1.valueType == config.limit_value_type.Unit){
                            //     limitText.push(apihelper.formatThousandGroup(benefit.plan.limit1) + " " + benefit.unit_name + "/" + limit1.durationType); 
                            // }else {
                            //     limitText.push(apihelper.formatThousandGroup(benefit.plan.limit1) + " " + limit1.valueType + "/" + limit1.durationType); 
                            // }
                        }
                    }

                    var limit2 = satuan_limit_data.find(s=> s.key == benefit.plan.limit2Type);
                    if(Boolean(limit2)){
                        benefit.usage2.valueType = limit2.valueType;
                        benefit.usage2.durationType = limit2.durationType;
                        if(limit2.valueType == config.limit_value_type.AsClaim) {
                            //unlimeted claim                    
                            //jika ini unlimeted, maka sisa yg boleh di claim adalah sisa rupiah dari tahunan di kurangin limit tahunan yg telah di claim   
                            if(telahAdaUnlimited) {
                                benefit.usage2.availableValue = null; // tidak perlu di munculkan limit yg sama 2 kali
                                benefit.usage2.limitValue = null;
                                benefit.usage2.value= null;
                            } else {
                                benefit.usage2.availableValue = policyData.benefit_year_limit.limit - policyData.yearly_usage;
                                benefit.usage2.limitValue = policyData.benefit_year_limit.limit;
                            }
                        }else {
                            benefit.usage2.availableValue = benefit.plan.limit2 - benefit.usage2.value;
                            benefit.usage2.limitValue = benefit.plan.limit2;

                            limitText.push(apihelper.formatThousandGroup(benefit.plan.limit2) + " " + apihelper.formatUnitName(limit2.valueType,limit2.durationType,benefit.unit_name));                             
                            // if(limit2.valueType == config.limit_value_type.Unit){
                            //     limitText.push(apihelper.formatThousandGroup(benefit.plan.limit2) + " " + benefit.unit_name + "/" + limit2.durationType); 
                            // }else {
                            //     limitText.push(apihelper.formatThousandGroup(benefit.plan.limit2) + " " + limit2.valueType + "/" + limit2.durationType); 
                            // }
                        }
                    }                   
                }
                benefit.limit = limitText;
            }
            benefit.plan = undefined;
            policyData.policy_benefit_detail.push(benefit);
        }
        policyData.benefit_usage = undefined;
        policyData.yearly_usage_limit = policyData.benefit_year_limit.limit - policyData.yearly_usage;
        policyData.yearly_usage = policyData.yearly_usage;
    } else {
        policyData.insurance_product = undefined;
    }
    return apihelper.APIResponseOK(res,true,"",policyData);
}))

router.get("/selection/", apihelper.authAccessOr({
    MPARTICIPANT:config.action.View,
    CLAIM:config.action.View|config.action.Create|config.action.Update,
    CLAIMPROCESS:config.action.View|config.action.Create|config.action.Update
}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const {page, perpage,searchquery} = req.query;
    
    var currentDate = moment().utc().startOf('day').toDate();

    var finalQuery = {
        is_active:true,
        policy_date : {$lte:currentDate},
        policy_end_date : {$gte:currentDate}                    
    }
    if(searchquery != null && searchquery != "") {
        var q = new RegExp(searchquery, 'i');
        finalQuery["$or"] = [];
        finalQuery["$or"].push({certificate_no : q});
        finalQuery["$or"].push({nama_tertanggung : q});
        finalQuery["$or"].push({"user.nama" : q});
    }



    var result = await UserPolicy.aggregate([
        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user"
        }}, 
        {$unwind:"$user"},
        {$match : finalQuery},
        { $project: {   'nik_tertanggung':1,'certificate_no':1,'nama_tertanggung':1,'policy_date':1,'policy_end_date':1,'dob_tertanggung':1, 'product_type':1,
                        'user._id':1,'user.nama':1,'user.email':1,'user.nik':1,'user.nomor':1
        }},
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
        
        if(result[0].docs){
            for(var x=0;x< result[0].docs.length;x++){
                result[0].docs[x].desc = result[0].docs[x].certificate_no + " / "+ result[0].docs[x].nama_tertanggung + " / " + moment(result[0].docs[x].dob_tertanggung).format("DD MMM YYYY") ;
            }
        }

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

    // var result = await  UserPolicy.paginate(finalQuery, { 
    //     select: "_id certificate_no nama_tertanggung nik_tertanggung dob_tertanggung user",
    //     populate: { path: 'user', select: '_id nama nik email nomor' },
    //     page: page, 
    //     sort: "nama_tertanggung",
    //     limit: parseInt(perpage)
    // });

    // if(result.docs){
    //     for(var x=0;x< result.docs.length;x++){
    //         result.docs[x] = result.docs[x].toObject();
    //         result.docs[x].desc = result.docs[x].certificate_no + " / "+ result.docs[x].user.nama + " / " + moment(result.docs[x].dob_tertanggung).format("DD MMM YYYY") ;
    //     }
    // }
    // return apihelper.APIResponseOK(res,true,"",result);
}))

var dataFunc = apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";

    var userData = null;
    if(!Boolean(data.user)) {
        errmsg += "* Silahkan input userr\n";
    }else {
        userData = await User.findOne({_id:data.user._id});
        if(!Boolean(userData)){
            errmsg += "* User tidak di temukan, silahkan cek kembali data anda\r\n";
        }
    }
          
    if(!Boolean(data.company_policy))
        errmsg += "* Silahkan input no polis perusahaan \r\n";
            
    if(!Boolean(data.certificate_no))
        errmsg += "* Silahkan input no sertifikat \r\n";

    if(!Boolean(data.nama_tertanggung))
        errmsg += "* Silahkan input nama tertanggung \r\n";

    if(!Boolean(data.card_no))
        errmsg += "* Silahkan input no kartu\r\n";

    if(Boolean(data.nik_tertanggung)){
        if(data.nik_tertanggung.length !=16)
            errmsg = "* NIK tertanggung harus 16 karakter \n";
    // }else{
    //     errmsg += "* Silahkan input NIK tetanggung\r\n";

    }

    if(!Boolean(data.policy_date))
        errmsg += "* Silahkan input policy date \r\n";

    var productData = null;
    if(!Boolean(data.insurance_product)) {
        errmsg += "* Silahkan input insurance product \r\n";
    }else {
        productData =await InsuranceProduct.findOne({_id : data.insurance_product._id});
        if(!Boolean(productData)){
            errmsg += "* Product tidak di temukan, silahkan cek kembali data anda \r\n";
        }
    }

    if(!Boolean(data.plan_name))
        errmsg += "* Silahkan input plan name \r\n";
  
    var companyPolicyData = await CompanyPolicy.findOne({policy_no: data.company_policy}).exec();
    if(!apihelper.isEmptyObj(companyPolicyData)){
        data.policy_end_date = companyPolicyData.policy_end_date;
        if(moment(companyPolicyData.policy_end_date).utc().isBefore(moment.utc(data.policy_date))){
            errmsg += "* Tanggal certificate tidak boleh setelah tanggal berakhir polis perusahaan => " + moment(companyPolicyData.policy_end_date).format("DD/MM/YYYY") +"\n";
        } 


        if(moment(companyPolicyData.policy_date).utc().isAfter(moment.utc(data.policy_date))){
            errmsg += "* Tanggal certificate tidak boleh sebelum tanggal mulai polis perusahaan => " + moment(companyPolicyData.policy_date).format("DD/MM/YYYY") +"\n";
        } 

    }else{
        errmsg += "* Company Policy tidak ditemukan \r\n";
    }

    var prevPolicyData = null;
    var prevUserData = null;
    if(Boolean(data._id)) {
        prevPolicyData = await UserPolicy.findOne({_id:data._id}).exec();
        prevUserData = await User.findOne({_id:prevPolicyData.user._id});

        if(Boolean(prevPolicyData)) {
            if(prevPolicyData.is_used)
                errmsg += "* Policy ini telah memiliki claim atau sedang di proses claim  \r\n";
            
            if(prevPolicyData.admin_policy_disable_at != null )
                errmsg += "* Policy ini telah di disable oleh admin, silahkan konfirmas ulang \r\n";

            // if(Boolean(prevPolicyData)){
            //     if(!apihelper.isEmptyObj(prevPolicyData.benefit_usage) && prevPolicyData.benefit_usage.length != 0){
            //         errmsg += "* Telah terdapat claim pada polis ini, data tidak dapat diedit lg \r\n";
            //     }        
            // }        
        }
    }


    if(Boolean(errmsg)) {
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }


    var policyDate = new moment(data.policy_date);
    var policyEndDate = new moment(data.policy_end_date);
    data.monthly_period = [];
    data.quarter_period = [];    
    data.semester_period = [];

    var quarterStartDate = policyDate.toDate();
    var semesterStartDate = policyDate.toDate();
    for(var month = 1;month<=12;month++){
        var endDate = null;
        if(month ==12)
            endDate =  policyDate.clone().add(month, 'months').toDate();                                      
        else
            endDate =   policyDate.clone().add(month, 'months').add(-1,"day").toDate();                                      
                
        var doexit = false;
        if(endDate > policyEndDate.toDate()){
            endDate = policyEndDate.clone().toDate();
            doexit = true;
        }

        var tmp1 = {
            period_start: policyDate.clone().add(month-1, 'months').toDate(),
            period_end: endDate
        };
        data.monthly_period.push(tmp1);


        if(month%3==0 || doexit){
            var tmp2 = {
                period_start: quarterStartDate,
                period_end: endDate
            };
            quarterStartDate = policyDate.clone().add(month, 'months').toDate();                                            
            data.quarter_period.push(tmp2);
        }
        if(month%6==0  || doexit){
            var tmp3 = {
                period_start: semesterStartDate,
                period_end: endDate
            };
            semesterStartDate = policyDate.clone().add(month, 'months').toDate();                                            
            data.semester_period.push(tmp3);
        }
    
        if(doexit)
            break;
    }



    if(data._id) {    

        userData.policy_count = await UserPolicy.countDocuments({user: data.user}).exec();
        userData.save();

        prevUserData.policy_count = await UserPolicy.countDocuments({user: prevPolicyData.user}).exec();
        prevUserData.save();

        data.updated_by = req.user;
        data.updated_at = moment().utc().toDate();        

        var result = await UserPolicy.findByIdAndUpdate({_id:data._id}, data,{
            upsert:true
        }).exec();        
    }else{
        userData.policy_count = await UserPolicy.countDocuments({user: data.user}).exec() + 1;
        userData.save();

        companyPolicyData.is_used = true;
        companyPolicyData.save();

        data.created_at = moment().utc().toDate();        
        data.created_by = req.user;

        var result = await UserPolicy.create(data);
    }

    return apihelper.APIResponseOK(res, true,"",undefined);
})

router.put("/", apihelper.authAccessOr({MPARTICIPANT:config.action.Create}) , dataFunc)

router.post("/", apihelper.authAccessOr({MPARTICIPANT:config.action.Update}) , dataFunc)

router.put("/disable", apihelper.authAccessOr({MPARTICIPANT:config.action.Update}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = req.body;

    var errmsg = "";


    var currentPolicy = null;

    var userData = null;
    if(!Boolean(data.policyId)) {
        errmsg += "* Silahkan input policy id\n";
    }else {

        currentPolicy = await UserPolicy.findOne({
            _id: ObjectID(data.policyId)
        }).lean().exec();

        if(!Boolean(currentPolicy)){
            errmsg += "* data polis tidak di temukan, silahkan cek kembali data polis anda\r\n";
        }
    }

    if(Boolean(errmsg)) {
        return apihelper.APIResponseOK(res, false,errmsg,undefined);
    }
  

    var dataToDisable = await UserPolicy.find({
        user: currentPolicy.user,
        insurance_product : currentPolicy.insurance_product
    }).exec();

    var certifiateNO = "";
    for (var key in dataToDisable){
        var tmp = dataToDisable[key];
        tmp.is_active = false;
        tmp.admin_policy_disable_by = req.user;
        tmp.admin_policy_disable_at = moment().utc().toDate();
        tmp.updated_at = moment().utc().toDate();       
        tmp.updated_by = req.user;   
        tmp.save();   
        certifiateNO += tmp.certificate_no + ", "        
    }

    certifiateNO = certifiateNO.substr(0,certifiateNO.length -2);


    return apihelper.APIResponseOK(res, true,"Polis dengan No Sertifikat " + certifiateNO + " telah di non aktifkan",undefined);

}))

router.delete("/:id", apihelper.authAccessOr({MPARTICIPANT:config.action.Delete}) ,  apihelper.handleErrorAsync(async (req, res, next) => {
    const id = req.params.id;
    var userPolicyData = await UserPolicy.findOne({_id:id}).exec();

    if(userPolicyData.is_used){
        return apihelper.APIResponseOK(res, false,"Policy ini telah memiliki claim atau sedang di proses claim",undefined);
    }

    var result = await UserPolicy.findByIdAndRemove(id).exec();
    return apihelper.APIResponseOK(res, true,"",undefined);
}))

module.exports = router;