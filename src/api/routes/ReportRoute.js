const config = require('../config/config');
const router = require('express').Router();
const UserClaim = require('../models/UserClaim');
const CompanyPolicy = require('../models/CompanyPolicy');
const CompanyPolicyDeposit = require('../models/CompanyPolicyDeposit');
const Company = require('../models/Company');
const Diagnose = require('../models/Diagnose');
const apihelper = require('../helper/APIHelper');
const moment = require('moment');

// Create a reusable style
const style = {
    font: {
        color: '#505050',
        size: 12,
        family: 'roman'
    },
    alignment : {
        vertical:'center'
    },
    numberFormat: '#,##0'
};

const styleDate = {
    font: {
        color: '#505050',
        size: 12,
        family: 'roman'
    },
    alignment : {
        vertical:'center'
    },
    numberFormat: 'dd-mm-yyyy'
};

const styleDateFlat = {
    font: {
        color: '#505050',
        size: 12,
        family: 'roman'
    },
    alignment : {
        vertical:'center'
    },
    numberFormat: 'dd-mm-yyyy'
}

const styleTableHeader = {
    font: {
        color: '#ffffff',
        size: 12,
        bold:true,
        family: 'roman'
    },
    alignment : {
        horizontal:'center',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#0067CC',
        fgColor: '#0067CC'
    }
};


const styleTableHeaderRed = {
    font: {
        color: '#ffffff',
        size: 12,
        bold:true,
        family: 'swiss'
    },
    alignment : {
        horizontal:'center',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#FF0000',
        fgColor: '#FF0000'
    }
};


const styleTableHeaderGreen = {
    font: {
        color: '#ffffff',
        size: 12,
        bold:true,
        family: 'swiss'
    },
    alignment : {
        horizontal:'center',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#097301',
        fgColor: '#097301'
    }
};

const styletitle = {
    font: {
        color: '#505050',
        size: 14,
        bold: true,
        family: 'roman'
    }
};

const styletitleCenter = {
    font: {
        color: '#505050',
        size: 14,
        bold: true,
        family: 'roman'
    },
    alignment : {
        horizontal:'center',vertical:'center'
    }
};

const stylesubtitle = {
    font: {
        color: '#505050',
        size: 12,
        bold: true,
        family: 'roman'
    }
};


var styleTableFooter = {
    font: {
        color: '#404040',
        size: 12,
        bold:true,
        family: 'roman'
    },
    numberFormat: '#,##0',
    alignment : {
        horizontal:'center',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#d0d0d0',
        fgColor: '#d0d0d0'
    }
};


var styleTableFooterGreen = {
    font: {
        color: '#ffffff',
        size: 12,
        bold:true,
        family: 'roman'
    },
    numberFormat: '#,##0',
    alignment : {
        horizontal:'center',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#097301',
        fgColor: '#097301'
    }
};

var styleTableFooterRight = {
    font: {
        color: '#404040',
        size: 12,
        bold:true,
        family: 'roman'
    },
    numberFormat: '#,##0',
    alignment : {
        horizontal:'right',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#d0d0d0',
        fgColor: '#d0d0d0'
    }
};

var styleTableFooterRightGreen = {
    font: {
        color: '#ffffff',
        size: 12,
        bold:true,
        family: 'roman'
    },
    numberFormat: '#,##0',
    alignment : {
        horizontal:'right',vertical:'center'
    },
    fill: {
        type : 'pattern',
        patternType: 'solid',
        bgColor: '#097301',
        fgColor: '#097301'
    }
};


router.get("/claim_ratio/:companyPolicy", apihelper.authAccessOr({RCLAIMRATIO:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var data = decodeURIComponent(req.params.companyPolicy);

    var companyPolicy = await CompanyPolicy.findOne({policy_no:data});
    var company = await Company.findOne({_id:companyPolicy.company});

    var reportData = await UserClaim.aggregate([
        {$lookup: { 
            from: "UserPolicy",
            localField:"policy",
            foreignField:"_id",
            as:"policy"
        }},
        {$unwind:"$policy"},
        {$match :{"policy.company_policy":data}},
        {$lookup: { 
            from: "insurance_product",
            localField:"policy.insurance_product",
            foreignField:"_id",
            as:"insurance_product"
        }},
        {$unwind:"$insurance_product"},
        {$group: {
            _id : "$insurance_product.type",
            total_claim: { $sum : "$claim_total_amount" },
            total_cover: { $sum : "$covered_total_amount" }
        }}
    ]).exec();

    var excel = require('excel4node');

    var workbook = new excel.Workbook();

    var worksheet = workbook.addWorksheet('Sheet 1');

    // Create a reusable style
    var style = workbook.createStyle({
        font: {
            color: '#505050',
            size: 12
        },
        alignment : {
            vertical:'center'
        },
        numberFormat: '#,##0.00; (#,##0.00)'
        }
    );
    var styleDate = workbook.createStyle({
        font: {
            color: '#505050',
            size: 12
        },
        alignment : {
            vertical:'center'
        },
        numberFormat: 'dd-mm-yyyy'
        }
    );

    var styleTableHeader = workbook.createStyle({
        font: {
            color: '#ffffff',
            size: 12,
            bold:true
        },
        alignment : {
            horizontal:'center',vertical:'center'
        },
        fill: {
            type : 'pattern',
            patternType: 'solid',
            bgColor: '#0067CC',
            fgColor: '#0067CC'
        }
    });

    var styleTableFooter = workbook.createStyle({
        font: {
            color: '#404040',
            size: 12,
            bold:true
        },
        alignment : {
            horizontal:'center',vertical:'center'
        },
        fill: {
            type : 'pattern',
            patternType: 'solid',
            bgColor: '#68B5FF',
            fgColor: '#68B5FF'
        },
        numberFormat: '#,##0.00; (#,##0.00)'
    });
    
    var styletitle = workbook.createStyle({
        font: {
            color: '#505050',
            size: 14,
            bold: true
        }
    });
    // Set value of cell A1 to 100 as a number type styled with paramaters of style
    worksheet.cell(1,1).string("CLAIM FUND REPORT").style(styletitle); 

    worksheet.cell(2,1).string("COMPANY"); 
    worksheet.cell(2,2).string(company.name); 
    worksheet.cell(3,1).string("COVERAGE NUMBER"); 
    worksheet.cell(3,2).string(companyPolicy.policy_no); 
    worksheet.cell(4,1).string("COVERAGE PERIOD"); 
    worksheet.cell(4,2).date(companyPolicy.policy_date).style(styleDate); 
    worksheet.cell(4,3).date(companyPolicy.policy_end_date).style(styleDate); 
    worksheet.cell(5,1).string("REPORT GENERATED ON"); 
    worksheet.cell(5,2).date(moment().utc().startOf('day').toDate()).style(styleDate); 

    var tableStartRow = 8;
    worksheet.row(tableStartRow).setHeight(25);
    worksheet.cell(tableStartRow,1).string("PRODUCT").style(styleTableHeader); 
    worksheet.cell(tableStartRow,2).string("ANNUAL CLAIM BUDGET").style(styleTableHeader); 
    worksheet.cell(tableStartRow,3).string("DEPOSITED CLAIM BUDGET").style(styleTableHeader); 
    worksheet.cell(tableStartRow,4).string("AMOUNT INCURRED").style(styleTableHeader); 
    worksheet.cell(tableStartRow,5).string("APPROVED AMOUNT").style(styleTableHeader); 
    worksheet.cell(tableStartRow,6).string("EXCESS AMOUNT").style(styleTableHeader); 
    worksheet.cell(tableStartRow,7).string("REMAINING DEPOSITED BUDGET").style(styleTableHeader); 
    tableStartRow++;
    
    var grandTotalClaim = 0;
    var grandTotalCover = 0; 
    reportData.forEach( x => {
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,1).string(x._id);
        worksheet.cell(tableStartRow,2).number(0).style(style); 
        worksheet.cell(tableStartRow,3).number(0).style(style); 
        worksheet.cell(tableStartRow,4).number(x.total_claim).style(style); 
        worksheet.cell(tableStartRow,5).number(x.total_cover).style(style); 
        worksheet.cell(tableStartRow,6).number(0).style(style); 
        worksheet.cell(tableStartRow,7).number(0).style(style); 
        grandTotalClaim += x.total_claim;
        grandTotalCover += x.total_cover;
        tableStartRow++;
    });
    worksheet.column(1).setWidth(20);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(20);
    worksheet.column(4).setWidth(20);
    worksheet.column(5).setWidth(20);
    worksheet.column(6).setWidth(20);
    worksheet.column(7).setWidth(20);

    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,1).string("TOTAL").style(styleTableFooter);
    worksheet.cell(tableStartRow,2).number(0).style(styleTableFooter); 
    worksheet.cell(tableStartRow,3).number(0).style(styleTableFooter); 
    worksheet.cell(tableStartRow,4).number(grandTotalClaim).style(styleTableFooter); 
    worksheet.cell(tableStartRow,5).number(grandTotalCover).style(styleTableFooter); 
    worksheet.cell(tableStartRow,6).number(0).style(styleTableFooter); 
    worksheet.cell(tableStartRow,7).number(0).style(styleTableFooter); 
 
    workbook.write('Claim_Fund_' + company.name + '_' + companyPolicy.policy_no + '_' + moment().startOf('day').format('DD_MMM_YYYY') + '.xlsx', res);
}))



//REPORT 2
router.get("/claim/:companypolicyCode", apihelper.authAccessOr({RCLAIMDETAIL:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var companypolicyCode = decodeURIComponent(req.params.companypolicyCode);

    
    var companyPolicy = await CompanyPolicy.findOne({policy_no:companypolicyCode});
    var company = await Company.findOne({_id:companyPolicy.company});

    var reportData = await UserClaim.aggregate([
        {$unwind:"$claim"},
    
        {$lookup: { 
            from: "UserPolicy",
            localField:"policy",
            foreignField:"_id",
            as:"policy"
        }}, 
        {$unwind:"$policy"},

        {$match :{"policy.company_policy":companypolicyCode}},

        {$lookup: { 
            from: "user",
            localField:"user",
            foreignField:"_id",
            as:"user"
        }}, 
        {$unwind:"$user"},

        {$lookup: { 
            from: "hospital",
            localField:"hospital",
            foreignField:"_id",
            as:"hospital"
        }},
        {$unwind:"$hospital"},        
        {$lookup: { 
            from: "diagnose",
            localField:"diagnose",
            foreignField:"_id",
            as:"diagnose"
        }},
        {$unwind:"$diagnose"},        

        {$lookup: { 
            from: "insurance_product",
            localField:"policy.insurance_product",
            foreignField:"_id",
            as:"insurance_product"
        }},
        {$unwind:"$insurance_product"},
        { $project: {'claim_no':1,'user_name':1,'policy':{'certificate_no':1,'nama_tertanggung':1,'relation':1, 'gender_tertanggung':1,'dob_tertanggung':1,'plan_name':1},
          'requester_name':1,'requester_relation':1, 'cashless':1,'diagnosis_note':1,'admission_date':1,'diagnose.name':1,
          'discharge_date':1,'claim':{'claim_amount':1,'covered_amount':1,'benefit':1,'claim_note':1},'insurance_product':{'name':1,'type':1},
          'benefit': {$filter: {
                input: '$insurance_product.benefit',
                as: 'item',
                cond: {$eq: ['$$item._id', '$claim.benefit']}
            }},
          'hospital.name':1,'created_at':1,'paid_date':1,'claim_form_received_date':1,'claim_status':1 }
        },
        {$unwind:"$benefit"},        
        {$sort:{created_at:1}},
    ]).exec();

    var depositData = await CompanyPolicyDeposit.find({company_policy: companyPolicy._id},[]).sort({transaction_date:1}).lean().exec();
    var indexDeposit = 0;

    if(depositData != null && depositData.length > 0){
        for(key in depositData) {
            var tempDeposit = depositData[key];

            var momentDeposit = moment(tempDeposit.transaction_date);

            reportData.push({
                type:"DEPOSIT",
                created_at:momentDeposit.toDate(),
                deposit:tempDeposit.amount,
                deposit_balance:tempDeposit.amount
            })
        };
    }

    reportData = reportData.sort((a,b)=>a.created_at.getTime()-b.created_at.getTime());

    var excel = require('excel4node');

    var workbook = new excel.Workbook();

    var worksheet = workbook.addWorksheet('Sheet 1');

    // Set value of cell A1 to 100 as a number type styled with paramaters of style
    worksheet.cell(1,1).string("CLAIM DETAIL REPORT").style(styletitle); 

    worksheet.cell(2,1).string("COMPANY"); 
    worksheet.cell(2,2).string(company.name); 
    worksheet.cell(3,1).string("COVERAGE NUMBER"); 
    worksheet.cell(3,2).string(companyPolicy.policy_no); 
    worksheet.cell(4,1).string("COVERAGE PERIOD"); 
    worksheet.cell(4,2).date(companyPolicy.policy_date).style(styleDate); 
    worksheet.cell(4,3).date(companyPolicy.policy_end_date).style(styleDate); 
    worksheet.cell(5,1).string("REPORT GENERATED ON"); 
    worksheet.cell(5,2).date(moment().utc().startOf('day').toDate()).style(styleDate); 

    var tableStartRow = 8;
    worksheet.row(tableStartRow).setHeight(25);
    worksheet.cell(tableStartRow,1).string("CLAIM TICKET NO").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,2).string("EMPLOYEE NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,3).string("CLAIMED CERTIFICATE NO.").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,4).string("PATIENT NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,5).string("PATIENT STATUS").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,6).string("DATE OF BIRTH").style(styleTableHeaderGreen)
    worksheet.cell(tableStartRow,7).string("GENDER").style(styleTableHeaderGreen); ; 
    worksheet.cell(tableStartRow,8).string("CLAIM METHOD").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,9).string("PRODUCT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,10).string("PLAN").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,11).string("BENEFIT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,12).string("DIAGNOSIS").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,13).string("ADMISSION DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,14).string("DISCHARGE DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,15).string("AMOUNT INCURRED").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,16).string("AMOUNT APPROVED").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,17).string("EXCESS AMOUNT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,18).string("REMARKS").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,19).string("PROVIDER NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,20).string("FIRST REPORT DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,21).string("CLAIM BILLING RECEIVED DATE").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,22).string("PAID DATE").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,23).string("CLAIM STATUS").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,24).string("DEPOSIT").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,25).string("DEPOSIT BALANCE").style(styleTableHeaderRed); 

    tableStartRow++;
    
    var grandTotalClaim = 0;
    var grandTotalCover = 0; 
    var totalDeposit = 0;
    reportData.forEach( x => {
        worksheet.row(tableStartRow).setHeight(23);
        if(x.type == "DEPOSIT"){
            totalDeposit += x.deposit;
            worksheet.cell(tableStartRow,20).date(x.created_at).style(styleDateFlat); 
            worksheet.cell(tableStartRow,24).number(x.deposit).style(style); 
            worksheet.cell(tableStartRow,25).number(totalDeposit).style(style); 
        }else{
            if(Boolean(x.claim.covered_amount))
                totalDeposit -=  x.claim.covered_amount;

            worksheet.cell(tableStartRow,1).string(x.claim_no).style(style); 
            worksheet.cell(tableStartRow,2).string(x.user_name).style(style); 
            worksheet.cell(tableStartRow,3).string(x.policy.certificate_no).style(style);       
            worksheet.cell(tableStartRow,4).string(x.policy.nama_tertanggung).style(style);
            worksheet.cell(tableStartRow,5).string(x.policy.relation).style(style); 
            worksheet.cell(tableStartRow,6).date(x.policy.dob_tertanggung).style(styleDateFlat); 
            worksheet.cell(tableStartRow,7).string(x.policy.gender_tertanggung).style(style); 
    
            if(x.cashless)
                worksheet.cell(tableStartRow,8).string('CASHLESS').style(style); 
            else
                worksheet.cell(tableStartRow,8).string('REIMBURSE').style(style); 
    
    
            worksheet.cell(tableStartRow,9).string(x.insurance_product.type).style(style); 
            worksheet.cell(tableStartRow,10).string(x.policy.plan_name).style(style); 
            worksheet.cell(tableStartRow,11).string(x.benefit.name).style(style); 
            worksheet.cell(tableStartRow,12).string(x.diagnose.name).style(style); 
    
            if(Boolean(x.admission_date))
                worksheet.cell(tableStartRow,13).date(x.admission_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,13).string('');
    
            if(Boolean(x.discharge_date))
                worksheet.cell(tableStartRow,14).date(x.discharge_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,14).string('');
       
    
            worksheet.cell(tableStartRow,15).number(x.claim.claim_amount || 0).style(style); 
            worksheet.cell(tableStartRow,16).number(x.claim.covered_amount || 0).style(style); 
            worksheet.cell(tableStartRow,17).number((x.claim.claim_amount - x.claim.covered_amount) || 0).style(style); 
            worksheet.cell(tableStartRow,18).string(x.claim.claim_note).style(style); 
            worksheet.cell(tableStartRow,19).string(x.hospital.name).style(style); 
            worksheet.cell(tableStartRow,20).date(x.created_at).style(styleDateFlat); 
    
            if(Boolean(x.claim_form_received_date))
                worksheet.cell(tableStartRow,21).date(x.claim_form_received_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,21).string('');
    
                
    
            if(Boolean(x.paid_date))
                worksheet.cell(tableStartRow,22).date(x.paid_date || null).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,22).string('');
    
    
            if(x.claim_status == config.claim_status.PAID){
                worksheet.cell(tableStartRow,23).string('CC').style(style); 
            }else{
                worksheet.cell(tableStartRow,23).string('CO').style(style); 
            }
            worksheet.cell(tableStartRow,25).number(totalDeposit).style(style); 
        }
        
        tableStartRow++;
    });
 
    workbook.write('Claim_Detail_' + company.name + '_' + companyPolicy.policy_no + '_' + moment().startOf('day').format('DD_MMM_YYYY') + '.xlsx', res);
}))


//REPORT 3
router.get("/claim/topdiag/:companypolicyCode", apihelper.authAccessOr({RTOPTEN:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var companypolicyCode = decodeURIComponent(req.params.companypolicyCode);

    var companyPolicy = await CompanyPolicy.findOne({policy_no:companypolicyCode});
    var company = await Company.findOne({_id:companyPolicy.company});

    var reportData = await UserClaim.aggregate([
    {
        $match :{
            "covered_total_amount":{$gt:0},
            "company_policy":companypolicyCode
        }  
    },
    {
        $group: {
            _id : {
                type: "$insurance_product_type",
                diagnose:"$diagnose"
            },
            total_paid: { $sum : "$covered_total_amount" },
            total_count: { $sum : 1 }
        }
    },
    {$lookup: { 
        from: "diagnose",
        localField:"_id.diagnose",
        foreignField:"_id",
        as:"_id.diagnose"
    }}, 
    {$unwind:"$_id.diagnose"},
    {
        $sort: {
            "_id.type":1,
            total_paid:-1
        }
    }
    ]).exec();
 
    
    var reportDataHospital = await UserClaim.aggregate([
    {
        $match :{
            "covered_total_amount":{$gt:0},
            "company_policy":companypolicyCode
        }  
    },
    {
        $group: {
            _id : {
                type: "$insurance_product_type",
                hospital:"$hospital"
            },
            total_paid: { $sum : "$covered_total_amount" },
            total_count: { $sum : 1 }
        }
    },
    {$lookup: { 
        from: "hospital",
        localField:"_id.hospital",
        foreignField:"_id",
        as:"_id.hospital"
    }}, 
    {$unwind:"$_id.hospital"},
    {
        $sort: {
            "_id.type":1,
            total_paid:-1
        }
    }
    ]).exec();

    var reportDataUser = await UserClaim.aggregate([
        {
            $lookup: { 
                from: "UserPolicy",
                localField:"policy",
                foreignField:"_id",
                as:"policy_data"
            }
        },
        {
            $match :{
                "covered_total_amount":{$gt:0},
                "company_policy":companypolicyCode
            }  
        },
        {
            $group: {
                _id : {
                    type: "$insurance_product_type",
                    user:"$policy_data.nama_tertanggung"
                },
                total_paid: { $sum : "$covered_total_amount" },
                total_count: { $sum : 1 }
            }
        },
        {
            $sort: {
                "_id.type":1,
                total_paid:-1
            }
        }
    ]).exec();    
    
    
    var reportDataCashless = await UserClaim.aggregate([
        {
            $lookup: { 
                from: "UserPolicy",
                localField:"policy",
                foreignField:"_id",
                as:"policy_data"
            }
        },
        {
            $match :{
                "covered_total_amount":{$gt:0},
                "company_policy":companypolicyCode
            }  
        },
        {
            $group: {
                _id : {
                    cashless: "$cashless",
                    user:"$policy_data.nama_tertanggung"
                },
                total_paid: { $sum : "$covered_total_amount" },
                total_count: { $sum : 1 }
            }
        },
        {
            $sort: {
                "_id.cashless":1,
                total_paid:-1
            }
        }
        ]).exec();  

    var excel = require('excel4node');
    var workbook = new excel.Workbook();
    var worksheet = workbook.addWorksheet('TOP 10');
    worksheet.cell(2,1).string("COMPANY"); 
    worksheet.cell(2,2).string(company.name); 
    worksheet.cell(3,1).string("COVERAGE NUMBER"); 
    worksheet.cell(3,2).string(companyPolicy.policy_no); 
    worksheet.cell(4,1).string("COVERAGE PERIOD"); 
    worksheet.cell(4,2).date(companyPolicy.policy_date).style(styleDate); 
    worksheet.cell(4,3).date(companyPolicy.policy_end_date).style(styleDate); 
    worksheet.cell(5,1).string("REPORT GENERATED ON"); 
    worksheet.cell(5,2).date(moment().utc().startOf('day').toDate()).style(styleDate); 

    var startColumn = 1;
    worksheet.cell(7,2).string("TOP 10 DIAGNOSES").style(styletitleCenter); 
    var tableStartRow = 7;
    var prevGroup1 = "";
    var counterGroup1 = 1;
    var summaryGroup1 = 0;
    var summaryGroup2 = 0;
    var first = true;
    for(var key in reportData){
        var data = reportData[key];

        if(counterGroup1 > 10){
            if(prevGroup1 == data._id.type)
                continue;
        }

        worksheet.row(tableStartRow).setHeight(25);
        if(prevGroup1 != data._id.type) {
            prevGroup1 = data._id.type;

            if(!first){
                tableStartRow++;
                worksheet.row(tableStartRow).setHeight(23);
                worksheet.cell(tableStartRow,startColumn +1).string("TOTAL").style(styleTableFooterGreen); 
                worksheet.cell(tableStartRow,startColumn +2).number(summaryGroup2).style(styleTableFooterRightGreen);     
                worksheet.cell(tableStartRow,startColumn +3).number(summaryGroup1).style(styleTableFooterRightGreen);     
            }
            first = false;

            tableStartRow+=2;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string(data._id.type).style(stylesubtitle); 
            tableStartRow++;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string("NO").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+1).string("DIAGNOSES").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+2).string("FREQUENCY").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+3).string("APPROVED AMOUNT").style(styleTableHeaderGreen); 
            counterGroup1 = 1;
            summaryGroup1 = 0;
            summaryGroup2 = 0;
        }

        tableStartRow++;
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,startColumn).number(counterGroup1).style(style);
        worksheet.cell(tableStartRow,startColumn+1).string(data._id.diagnose.name).style(style); 
        worksheet.cell(tableStartRow,startColumn+2).number(data.total_count).style(style); 
        worksheet.cell(tableStartRow,startColumn+3).number(data.total_paid).style(style); 


        summaryGroup1 += data.total_paid;
        summaryGroup2 += data.total_count;
        counterGroup1++;
    }
    tableStartRow++;
    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
    worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup2).style(styleTableFooterRightGreen);
    worksheet.cell(tableStartRow,startColumn+3).number(summaryGroup1).style(styleTableFooterRightGreen);
    worksheet.column(startColumn).setWidth(7);
    worksheet.column(startColumn+1).setWidth(35);
    worksheet.column(startColumn+2).setWidth(15);
    worksheet.column(startColumn+3).setWidth(20);

    //############### TOP 10 PROVIDER ########################################
    startColumn = 6;
    tableStartRow = 7;
    worksheet.cell(tableStartRow,startColumn+1).string("TOP 10 PROVIDER").style(styletitleCenter); 
    prevGroup1 = "";
    counterGroup1 = 1;
    summaryGroup1 = 0;
    summaryGroup2 = 0;
    first = true;
    for(var key in reportDataHospital){
        var data = reportDataHospital[key];

        if(counterGroup1 > 10){
            if(prevGroup1 == data._id.type)
                continue;
        }

        worksheet.row(tableStartRow).setHeight(25);
        if(prevGroup1 != data._id.type) {
            prevGroup1 = data._id.type;

            if(!first){
                tableStartRow++;
                worksheet.row(tableStartRow).setHeight(23);
                worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
                worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup2).style(styleTableFooterRightGreen);     
                worksheet.cell(tableStartRow,startColumn+3).number(summaryGroup1).style(styleTableFooterRightGreen);     
            }
            first = false;

            tableStartRow+=2;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string(data._id.type).style(stylesubtitle); 
            tableStartRow++;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string("NO").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+1).string("PROVIDER").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+2).string("FREQUENCY").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+3).string("APPROVED AMOUNT").style(styleTableHeaderGreen); 
            counterGroup1 = 1;
            summaryGroup1 = 0;
            summaryGroup2 = 0;
        }

        tableStartRow++;
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,startColumn).number(counterGroup1).style(style);
        worksheet.cell(tableStartRow,startColumn+1).string(data._id.hospital.name).style(style); 
        worksheet.cell(tableStartRow,startColumn+2).number(data.total_count).style(style); 
        worksheet.cell(tableStartRow,startColumn+3).number(data.total_paid).style(style); 

        summaryGroup1 += data.total_paid;
        summaryGroup2 += data.total_count;
        counterGroup1++;
    }
    tableStartRow++;
    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
    worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup2).style(styleTableFooterRightGreen);
    worksheet.cell(tableStartRow,startColumn+3).number(summaryGroup1).style(styleTableFooterRightGreen);
    worksheet.column(startColumn).setWidth(7);
    worksheet.column(startColumn+1).setWidth(35);
    worksheet.column(startColumn+2).setWidth(15);
    worksheet.column(startColumn+3).setWidth(20);


        
    //############### TOP 10 Claimant ########################################
    startColumn = 11;
    tableStartRow = 7;
    worksheet.cell(tableStartRow,startColumn+1).string("TOP 10 CLAIMANT").style(styletitleCenter); 
    prevGroup1 = "";
    counterGroup1 = 1;
    summaryGroup1 = 0;
    summaryGroup2 = 0;
    first = true;

    for(var key in reportDataUser){
        var data = reportDataUser[key];

        if(counterGroup1 > 10){
            if(prevGroup1 == data._id.type)
                continue;
        }

        worksheet.row(tableStartRow).setHeight(25);
        if(prevGroup1 != data._id.type) {
            prevGroup1 = data._id.type;

            if(!first){
                tableStartRow++;
                worksheet.row(tableStartRow).setHeight(23);
                worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
                worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup2).style(styleTableFooterRightGreen);     
                worksheet.cell(tableStartRow,startColumn+3).number(summaryGroup1).style(styleTableFooterRightGreen);     
            }
            first = false;

            tableStartRow+=2;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string(data._id.type).style(stylesubtitle); 
            tableStartRow++;
            
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string("NO").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+1).string("PARTICIPANT NAME").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+2).string("FREQUENCY").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+3).string("APPROVED AMOUNT").style(styleTableHeaderGreen); 
            counterGroup1 = 1;
            summaryGroup1 = 0;
            summaryGroup2 = 0;
        }

        tableStartRow++;
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,startColumn).number(counterGroup1).style(style);
        worksheet.cell(tableStartRow,startColumn+1).string(data._id.user).style(style); 
        worksheet.cell(tableStartRow,startColumn+2).number(data.total_count).style(style); 
        worksheet.cell(tableStartRow,startColumn+3).number(data.total_paid).style(style); 

        summaryGroup1 += data.total_paid;
        summaryGroup2 += data.total_count;
        counterGroup1++;
    }
    tableStartRow++;
    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
    worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup2).style(styleTableFooterRightGreen);
    worksheet.cell(tableStartRow,startColumn+3).number(summaryGroup1).style(styleTableFooterRightGreen);
    worksheet.column(startColumn).setWidth(7);
    worksheet.column(startColumn+1).setWidth(35);
    worksheet.column(startColumn+2).setWidth(15);
    worksheet.column(startColumn+3).setWidth(20);


    //############### TOP 10 Cashless ########################################
    startColumn = 16;
    tableStartRow = 7;
    worksheet.cell(tableStartRow,startColumn+1).string("TOP TEN BY CLAIM METHOD").style(styletitleCenter); 
    prevGroup1 = null;
    counterGroup1 = 1;
    summaryGroup1 = 0;
    first = true;
    for(var key in reportDataCashless){
        var data = reportDataCashless[key];

        if(counterGroup1 > 10){
            if(prevGroup1 == data._id.cashless)
                continue;
        }

        worksheet.row(tableStartRow).setHeight(25);
        if(prevGroup1 != data._id.cashless) {
            prevGroup1 = data._id.cashless;

            if(!first){
                tableStartRow++;
                worksheet.row(tableStartRow).setHeight(23);
                worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
                worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup1).style(styleTableFooterRightGreen);     
            }
            first = false;

            tableStartRow+=2;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string(data._id.cashless?"CASHLESS":"REIMBURSEMENT").style(stylesubtitle); 
            tableStartRow++;
            worksheet.row(tableStartRow).setHeight(25);
            worksheet.cell(tableStartRow,startColumn).string("NO").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+1).string("PARTICIPANT NAME").style(styleTableHeaderGreen); 
            worksheet.cell(tableStartRow,startColumn+2).string("APPROVED AMOUNT").style(styleTableHeaderGreen); 
            counterGroup1 = 1;
            summaryGroup1 = 0;
        }

        tableStartRow++;
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,startColumn).number(counterGroup1).style(style);
        worksheet.cell(tableStartRow,startColumn+1).string(data._id.user).style(style); 
        worksheet.cell(tableStartRow,startColumn+2).number(data.total_paid).style(style); 

        summaryGroup1 += data.total_paid;
        counterGroup1++;
    }
    tableStartRow++;
    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,startColumn+1).string("TOTAL").style(styleTableFooterGreen); 
    worksheet.cell(tableStartRow,startColumn+2).number(summaryGroup1).style(styleTableFooterRightGreen);
    worksheet.column(startColumn).setWidth(7);
    worksheet.column(startColumn+1).setWidth(35);
    worksheet.column(startColumn+2).setWidth(20);

    workbook.write('Top_10_' + company.name + '_' + companyPolicy.policy_no + '_' + moment().startOf('day').format('DD_MMM_YYYY') + '.xlsx', res);
}))


router.get("/fund/:companyPolicy", apihelper.authAccessOr({RCLAIMRATIO:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {
    var policyNo = decodeURIComponent(req.params.companyPolicy);

    var companyPolicy = await CompanyPolicy.findOne({policy_no:policyNo});
    var company = await Company.findOne({_id:companyPolicy.company});

    var claimAgregateData = await UserClaim.aggregate([       
        {$match :{"company_policy":policyNo}},
        {$lookup: { 
            from: "UserPolicy",
            localField:"policy",
            foreignField:"_id",
            as:"policy"
        }},
        {$unwind:"$policy"},
        {$lookup: { 
            from: "insurance_product",
            localField:"policy.insurance_product",
            foreignField:"_id",
            as:"insurance_product"
        }},
        {$unwind:"$insurance_product"},    
        { $group: {
            _id: "$insurance_product.name",
            claim_total_amount: {$sum:"$claim_total_amount"},
            covered_total_amount: {$sum:"$covered_total_amount"}
    
        }}
    ]).exec();


    var deposit = await CompanyPolicyDeposit.aggregate([
        {$match :{"company_policy":companyPolicy._id}},
        { $group: {
            _id: null,
            total: {$sum:"$amount"}
        }}
    ]).exec();

    totalDeposit = 0;
    if(Boolean(deposit) && deposit.length > 0)
        totalDeposit = deposit[0].total;

    var excel = require('excel4node');

    var workbook = new excel.Workbook();

    var worksheet = workbook.addWorksheet('Sheet 1');

    worksheet.cell(1,1).string("CLAIM FUND REPORT").style(styletitle); 

    worksheet.cell(2,1).string("COMPANY"); 
    worksheet.cell(2,2).string(company.name); 
    worksheet.cell(3,1).string("COVERAGE NUMBER"); 
    worksheet.cell(3,2).string(companyPolicy.policy_no); 
    worksheet.cell(4,1).string("COVERAGE PERIOD"); 
    worksheet.cell(4,2).date(companyPolicy.policy_date).style(styleDate); 
    worksheet.cell(4,3).date(companyPolicy.policy_end_date).style(styleDate); 
    worksheet.cell(5,1).string("REPORT GENERATED ON"); 
    worksheet.cell(5,2).date(moment().utc().startOf('day').toDate()).style(styleDate); 

    var tableStartRow = 8;
    worksheet.row(tableStartRow).setHeight(25);
    worksheet.cell(tableStartRow,1).string("PRODUCT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,2).string("DEPOSIT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,3).string("AMOUNT INCURRED").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,4).string("APPROVED AMOUNT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,5).string("EXCESS AMOUNT").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,6).string("DEPOSIT BALANCE").style(styleTableHeaderGreen); 
    tableStartRow++;
    
    var depositAccumulation = totalDeposit;
    var grandTotalClaim = 0;
    var grandTotalCover = 0;
    claimAgregateData.forEach( x => {
        depositAccumulation -= x.covered_total_amount;
		
        worksheet.row(tableStartRow).setHeight(23);
        worksheet.cell(tableStartRow,1).string(x._id);
        worksheet.cell(tableStartRow,2).number(totalDeposit).style(style); 
        worksheet.cell(tableStartRow,3).number(x.claim_total_amount).style(style); 
        worksheet.cell(tableStartRow,4).number(x.covered_total_amount).style(style); 
        worksheet.cell(tableStartRow,5).number(x.claim_total_amount - x.covered_total_amount).style(style); 
        worksheet.cell(tableStartRow,6).number(depositAccumulation).style(style); 
        grandTotalClaim += x.claim_total_amount;
        grandTotalCover += x.covered_total_amount;
        tableStartRow++;
    });
    worksheet.column(1).setWidth(20);
    worksheet.column(2).setWidth(20);
    worksheet.column(3).setWidth(20);
    worksheet.column(4).setWidth(20);
    worksheet.column(5).setWidth(20);
    worksheet.column(6).setWidth(20);
    worksheet.column(7).setWidth(20);

    worksheet.row(tableStartRow).setHeight(23);
    worksheet.cell(tableStartRow,1).string("TOTAL").style(styleTableFooterGreen);
    worksheet.cell(tableStartRow,2).number(totalDeposit).style(styleTableFooterRightGreen); 
    worksheet.cell(tableStartRow,3).number(grandTotalClaim).style(styleTableFooterRightGreen); 
    worksheet.cell(tableStartRow,4).number(grandTotalCover).style(styleTableFooterRightGreen); 
    worksheet.cell(tableStartRow,5).number(grandTotalClaim - grandTotalCover).style(styleTableFooterRightGreen); 
    worksheet.cell(tableStartRow,6).number(depositAccumulation).style(styleTableFooterRightGreen); 
 
    workbook.write('Claim_Fund_' + company.name + '_' + companyPolicy.policy_no + '_' + moment().startOf('day').format('DD_MMM_YYYY') + '.xlsx', res);
}))






/*REPORT deposit
router.get("/deposit/:companypolicyCode", apihelper.authAccessOr({RCLAIMDETAIL:config.action.View}) , apihelper.handleErrorAsync(async (req, res, next) => {    
    var companypolicyCode = decodeURIComponent(req.params.companypolicyCode);

    var companyPolicy = await CompanyPolicy.findOne({policy_no:companypolicyCode});

    var filter= {company_policy:companyPolicy._id};

    
    var company = await Company.findOne({_id:companyPolicy.company});

    var reportData = await CompanyPolicyDeposit.aggregate([
        {$match : filter},
    
        { $project: {'transaction_date':1,'amount':1,'note':1,'created_by':1,'created_at':1 }
        },
        {$sort:{created_at:1}},
    ]).exec();

    var depositData = await CompanyPolicyDeposit.find({company_policy: companyPolicy._id},[]).sort({transaction_date:1}).lean().exec();
    var indexDeposit = 0;

    if(depositData != null && depositData.length > 0){
        for(key in depositData) {
            var tempDeposit = depositData[key];

            var momentDeposit = moment(tempDeposit.transaction_date);

            reportData.push({
                type:"DEPOSIT",
                created_at:momentDeposit.toDate(),
                deposit:tempDeposit.amount,
                deposit_balance:tempDeposit.amount
            })
        };
    }

    reportData = reportData.sort((a,b)=>a.created_at.getTime()-b.created_at.getTime());

    var excel = require('excel4node');

    var workbook = new excel.Workbook();

    var worksheet = workbook.addWorksheet('Sheet 1');

    // Set value of cell A1 to 100 as a number type styled with paramaters of style
    worksheet.cell(1,1).string("CLAIM DETAIL REPORT").style(styletitle); 

    worksheet.cell(2,1).string("COMPANY"); 
    worksheet.cell(2,2).string(company.name); 
    worksheet.cell(3,1).string("COVERAGE NUMBER"); 
    worksheet.cell(3,2).string(companyPolicy.policy_no); 
    worksheet.cell(4,1).string("COVERAGE PERIOD"); 
    worksheet.cell(4,2).date(companyPolicy.policy_date).style(styleDate); 
    worksheet.cell(4,3).date(companyPolicy.policy_end_date).style(styleDate); 
    worksheet.cell(5,1).string("REPORT GENERATED ON"); 
    worksheet.cell(5,2).date(moment().startOf('day').toDate()).style(styleDate); 

    var tableStartRow = 8;
    worksheet.row(tableStartRow).setHeight(25);
    worksheet.cell(tableStartRow,1).string("CLAIM TICKET NO").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,2).string("EMPLOYEE NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,3).string("CLAIMED CERTIFICATE NO.").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,4).string("PATIENT NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,5).string("PATIENT STATUS").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,6).string("DATE OF BIRTH").style(styleTableHeaderGreen)
    worksheet.cell(tableStartRow,7).string("GENDER").style(styleTableHeaderGreen); ; 
    worksheet.cell(tableStartRow,8).string("CLAIM METHOD").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,9).string("PRODUCT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,10).string("PLAN").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,11).string("BENEFIT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,12).string("DIAGNOSIS").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,13).string("ADMISSION DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,14).string("DISCHARGE DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,15).string("AMOUNT INCURRED").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,16).string("AMOUNT APPROVED").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,17).string("EXCESS AMOUNT").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,18).string("PROVIDER NAME").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,19).string("FIRST REPORT DATE").style(styleTableHeaderGreen); 
    worksheet.cell(tableStartRow,20).string("CLAIM BILLING RECEIVED DATE").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,21).string("PAID DATE").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,22).string("CLAIM STATUS").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,23).string("DEPOSIT").style(styleTableHeaderRed); 
    worksheet.cell(tableStartRow,24).string("DEPOSIT BALANCE").style(styleTableHeaderRed); 

    tableStartRow++;
    
    var grandTotalClaim = 0;
    var grandTotalCover = 0; 
    var totalDeposit = 0;
    reportData.forEach( x => {
        worksheet.row(tableStartRow).setHeight(23);
        if(x.type == "DEPOSIT"){
            totalDeposit += x.deposit;
            worksheet.cell(tableStartRow,19).date(x.created_at).style(styleDateFlat); 
            worksheet.cell(tableStartRow,23).number(x.deposit).style(style); 
            worksheet.cell(tableStartRow,24).number(totalDeposit).style(style); 
        }else{
            if(Boolean(x.claim.covered_amount))
                totalDeposit -=  x.claim.covered_amount;

            worksheet.cell(tableStartRow,1).string(x.claim_no).style(style); 
            worksheet.cell(tableStartRow,2).string(x.user_name).style(style); 
            worksheet.cell(tableStartRow,3).string(x.policy.certificate_no).style(style);       
            worksheet.cell(tableStartRow,4).string(x.requester_name).style(style);
            worksheet.cell(tableStartRow,5).string(x.requester_relation).style(style); 
            worksheet.cell(tableStartRow,6).date(x.policy.dob_tertanggung).style(style); 
            worksheet.cell(tableStartRow,7).string(x.policy.gender_tertanggung).style(style); 
    
            if(x.cashless)
                worksheet.cell(tableStartRow,8).string('CASHLESS').style(style); 
            else
                worksheet.cell(tableStartRow,8).string('REIMBURSE').style(style); 
    
    
            worksheet.cell(tableStartRow,9).string(x.insurance_product.type).style(style); 
            worksheet.cell(tableStartRow,10).string(x.policy.plan_name).style(style); 
            worksheet.cell(tableStartRow,11).string(x.benefit.name).style(style); 
            worksheet.cell(tableStartRow,12).string(x.diagnose.name).style(style); 
    
            if(Boolean(x.admission_date))
                worksheet.cell(tableStartRow,13).date(x.admission_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,13).string('');
    
            if(Boolean(x.discharge_date))
                worksheet.cell(tableStartRow,14).date(x.discharge_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,14).string('');
       
    
            worksheet.cell(tableStartRow,15).number(x.claim.claim_amount || 0).style(style); 
            worksheet.cell(tableStartRow,16).number(x.claim.covered_amount || 0).style(style); 
            worksheet.cell(tableStartRow,17).number((x.claim.claim_amount - x.claim.covered_amount) || 0).style(style); 
            worksheet.cell(tableStartRow,18).string(x.hospital.name).style(style); 
            worksheet.cell(tableStartRow,19).date(x.created_at).style(styleDateFlat); 
    
            if(Boolean(x.claim_form_received_date))
                worksheet.cell(tableStartRow,20).date(x.claim_form_received_date).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,20).string('');
    
                
    
            if(Boolean(x.paid_date))
                worksheet.cell(tableStartRow,21).date(x.paid_date || null).style(styleDateFlat); 
            else
                worksheet.cell(tableStartRow,21).string('');
    
    
            if(x.claim_status == config.claim_status.PAID){
                worksheet.cell(tableStartRow,22).string('CC').style(style); 
            }else{
                worksheet.cell(tableStartRow,22).string('CO').style(style); 
            }
            worksheet.cell(tableStartRow,24).number(totalDeposit).style(style); 
        }
        
        tableStartRow++;
    });
 
    workbook.write('Claim_Detail_' + company.name + '_' + companyPolicy.policy_no + '_' + moment().startOf('day').format('DD_MMM_YYYY') + '.xlsx', res);
})) */


module.exports = router;