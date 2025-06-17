const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/company');
const Personal = require('../models/personal');
const Transactionz = require('../models/transactionz');
const Tlogs = require('../models/tlogs');
const Vat = require('../models/vat');
const PM = require('../middleware/privilegemanager');


var https = require('https');
var http = require('http');
// const cron = require("node-cron"); // Cron jobs
var trans_id;

function getDataFromTaxPro(dataInput, token, queryPath, method, live) {
    let data = '';
    let dataOptions;
        
    console.log('DATAIN:: ' + dataInput);
    if (live) { // Data Options for Live Environment
        dataOptions = {
            hostname: process.env.TAXPRO_HOSTNAME,
            path: queryPath,
            method: method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': token,
              'Content-Length': Buffer.byteLength(dataInput),
        },
        };

    } else{ // Data Options for Test Environment
     dataOptions = {
        hostname: process.env.TAXPRO_HOSTNAME,
        path: queryPath,
        method: method,
        port: process.env.TAXPRO_PORT,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + token,
          'Content-Length': Buffer.byteLength(dataInput),
    },
    };

    }
     
    
    const request = http.request(dataOptions, (response) => {
      response.setEncoding('utf8');
  
      response.on('data', (chunk) => {
        data += chunk;
      });
  
      response.on('end', () => {
        console.log('Returned Data:: ' + data);
        console.log('Vat PAID:' + data.slice(10));
        // const dat = JSON.parse(data);

        let vatReturned = data.slice(10);
        taxProPayLiteral = +vatReturned;
        // res (resp = {data: vatReturned });
        // if (data === 'error msg') {
        //     // Ask the Login process to reinitiate login
        //     taxProloginStatus = false;
        //     return 'Err: 4000';
        // } else {

        //     return 'Err: 5000';
        //     // var newData = JSON.parse(data);
        //     // return newData.vat_paid;
      
        //     // console.log('Data submitted to TaxPro successfully! TRANS_ID:: ' + trans_id);
        // }
        
      });
    });


    request.on('error', (error) => {
      console.error(error);
    //   taxProloginStatus = false;
    });
  
    // Write data to the request body
    request.write(dataInput);
  
    request.end();

    
  };


function generateToken(n) {
  
    var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   
    console.log(n);
    // if ( n > max ) {
    //         return generate(max) + generate(n - max);
    // }
    max        = Math.pow(10, n+add);
    var min    = max/10; // Math.pow(10, n) basically
    var number = Math.floor( Math.random() * (max - min + 1) ) + min;

    return ("" + number).substring(add); 
}


exports.getTransactionz= (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactions');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    
    // console.log('Filter:: ' + tempFilter);
        Vat.find({}, 'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id')
        .then(trxs => {
            res.status(200).json({message: 'success', data: trxs});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

exports.getOneTransaction = (req, res, next) => {

    const access = PM.routesmanager(req.user.userType, 'transaction');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    const trxId = req.params.trx_id;
    console.log('trxID:' + trxId);
    Vat.findOne({trx_id: trxId}, 'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id')
    .then(trxs => {
        console.log(JSON.stringify(trxs));
        res.status(200).json(trxs);
        
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}


exports.getAllTransactionsByOwner = (req, res, next) => {
    const access = PM.routesmanager(req.user.userType, 'transactionsbyowner');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    // const cacId = req.params.cac_id;
    const userId = req.params.user_id;
    // console.log('U ID::' + userId);
    Vat.find({cac_id: userId}, 'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat lower_vat sector sub_sector data_submitted taxpro_trans_id')
    .then(trxs => {
        if (trxs) {
            res.status(201).json({'message': 'Success', 'data': trxs });
        } else {
            res.status(201).json({'message':'No data found' });
        }
      
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.getAllTransactionsByOwnerWith2Dates = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionsbyownerwith2dates');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    // const today = new Date();
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getOwnerByTransaction = (req, res, next) => {
    const access = PM.routesmanager(req.user.userType, 'ownerbytransaction');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    const trxId = req.params.trx_id;
    // const userId = req.params.user_id;
    Vat.findOne({trx_id: trxId})
    .then(trx => {
        if (trx) {
            Company.findOne({cac_id: trx.cac_id}, 'company_name company_address firs tin sector sub_sector company_head email phone image_url brief_history extra_note incorporation_date')
            .then(coy =>{

                if (coy) {
                    res.status(201).json({message: 'success', data: coy});
                }
             else
                {
                    Personal.findOne({user_id: userId})
                    .then (pers =>{
                        if (!pers) {
                            res.status(201).json({message: 'No user found!'});                    
                        }
                        res.status(201).json({message: 'success', data: pers});                           
                })
            }
        })
    }
        else {
            res.status(201).json({message: 'No transaction found!'});
         }
        return trx;
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

function getOpposite(tradeType) {
if (tradeType == 'Buy') return 'Sell';
if (tradeType == 'Sell') return 'Buy';
}

exports.addTransaction = async (req, res, next) => {
    const access = PM.routesmanager(req.user.userType, 'addtransaction');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }
    
    const trxId = generateToken(10);
 
    var sector;
    var sub_sector;
    var trx_value;


    const trx_ref_provider = req.body.trx_ref_provider;
    const user_id = req.body.user_id;
    const personal_id = req.body.personal_id;
    const company_code = req.body.company_code;
    const trx_type = req.body.trx_type;
    const trade_type = req.body.trade_type;
    const cscs_number = req.body.cscs_number;
    const beneficiary_name = req.body.beneficiary_name;
    const stock_symbol = req.body.stock_symbol;
    const price = req.body.price;
    const volume = req.body.volume;
    const counter_party_code = req.body.counter_party_code;
    const remarks = req.body.remarks;
    const provider_code = req.body.provider_code;
    const counter_party_beneficiary_name = req.body.counter_party_name;
    const counter_party_cscs = req.body.counter_party_cscs;
    
    trx_value = (volume * price);
    


    // Identify data provider
    if (provider_code === 'NGX01') {
        sector = 'Capital Market';
    }

    var company_name = req.body.company_name;
    var counter_party_name = req.body.counter_part_name;

    var main_company = await Company.findOne(
        {'company_code': company_code}
    );

    var counterparty_company = await Company.findOne(
        {'company_code': counter_party_code}
    );

    var sec_company = await Company.findOne(
        {'company_code': 'SEC'}
    );

    var cscs_company = await Company.findOne(
        {'company_code': 'CSCS'}
    );

    var ngx_company = await Company.findOne(
        {'company_code': 'NGX'}
    );

    // console.log('COY1:: ' + main_company.company_name + ', region: ' + main_company.region + ', State: ' + main_company.state);
    // console.log('COY2:: ' + counterparty_company.company_name + ', region: ' + counterparty_company.region + ', State: ' + counterparty_company.state);
    // console.log('SEC:: ' + sec_company.company_name + ', region: ' + sec_company.region + ', State: ' + sec_company.state);
    // console.log('COY1:: ' + ngx_company.company_name + ', region: ' + ngx_company.region + ', State: ' + ngx_company.state);
    // console.log('COY1:: ' + cscs_company.company_name + ', region: ' + cscs_company.region + ', State: ' + cscs_company.state);
    


    // const vat = (+req.body.trx_value * 7.5)/100;
    
    
    // if (cac_id) user_id = cac_id;
    // if (personal_id) user_id = personal_id;

        const transaction = new Transactionz({
            trx_ref_provider: trx_ref_provider,
            trx_id: trxId,
            cac_id: main_company.cac_id,
            user_id: main_company.cac_id,
            company_name: main_company.company_name,
            sector: sector,
            // sub_sector: sub_sector,
            trx_type: trx_type,
            trade_type: trade_type,
            cscs_number: cscs_number,
            beneficiary_name: beneficiary_name,
            stock_symbol: stock_symbol,
            price: price,
            volume: volume,
            counter_party_company_code: counter_party_code,
            counter_party_company_name: counterparty_company.company_name,
            provider_code: provider_code,
            trx_value: trx_value,
            remarks: remarks,
            counter_party_name: counter_party_beneficiary_name,
            counter_party_cscs_number: counter_party_cscs

                        
            });
            
            transaction.save()
             
            .then(async dat => {

                var totalAmount = volume * price;
                var lowerCommission = 0;
                var upperCommission = 0;
                var secFee = 0;
                var cscsFee = 0;
                var ngxFee = 0;


                secFee = (0.3 * totalAmount)/100;
                cscsFee = (0.3 * totalAmount)/100;
                ngxFee = (0.3 * totalAmount)/100;
                lowerCommission = (0.75 * totalAmount)/100 ;
                upperCommission = (1.35 * totalAmount)/100;

                var lowerVat = (lowerCommission * 7.5)/100;
                var upperVat = (upperCommission * 7.5)/100;
                var secVat = (secFee * 7.5)/100;
                var cscsVat = (cscsFee * 7.5)/100;
                var ngxVat = (ngxFee * 7.5)/100;
                
                var  mktDate = new Date();
                var dd = mktDate.getDate();
                var mm = mktDate.getMonth();
                var yyyy = mktDate.getFullYear();
                var trDate = yyyy + '-'+ mm + '-' + dd;

                console.log('DATE::' + trDate);
                
                // Get Vat for Initiator Company
                const initiatorCompany = new Vat ({
                
                    trx_id: trxId,
                    transaction_ref: trx_ref_provider,
                    cac_id: main_company.cac_id,
                    transaction_type: trx_type,
                    trade_type: trade_type,
                    tin: main_company.tin,
                    agent_tin: main_company.tin, 
                    beneficiary_tin: main_company.tin,
                    currency: 1,
                    transaction_amount: totalAmount,
                    vat: upperVat,
                    vat_rate: 7.5,
                    vat_status: 0,
                    base_amount: upperCommission,
                    total_amount: upperCommission + upperVat,

                    lower_vat: lowerVat,
                    upper_vat: upperVat,
                    total_amount_lower: lowerCommission + lowerVat,
                    total_amount_upper: upperCommission + upperVat,

                    other_taxes: 0,
                    company_name: main_company.company_name,
                    company_code: main_company.company_code,
                    sector: sector,
                    sub_sector: 'STOCKBROKERS',
                    item_description: 'Stock trading',
                    transaction_date: trDate,
                    data_submitted: 0,
                    vat_rate: 7.5,
                    vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                    item_id: trxId + '1',
                    earning_type: 'Commission',
                    region: main_company.region,
                    state: main_company.state,
                    trans_threshold: main_company.trans_threshold
                    
            
                });

                await initiatorCompany.save();
                companyData.push (initiatorCompany);

                // await Promise.resolve(submitDataToTaxPro(initiatorCompany, bearerToken, false))
                // .then(response => 
                    
                //     Vat.findOne({agent_tin: initiatorCompany.agent_tin} && {trx_id: initiatorCompany.trx_id})
                //     .then(vatFound =>{
                //     vatFound.taxpro_trans_id = trans_id;
                //     vatFound.data_submitted = 1; 
                //     vatFound.save();

                //     console.log('Done Executing initiator');
                // }));
                    

                // submitDataToTaxPro(initiatorCompany, bearerToken, false)


                

                // .then(vat => {
                //     console.log('Vat Data:: ' + vat);
                //     // res.status(201).json({message: 'Data Transmitted successfully', data: vat});

                // })
                // .catch(err => {
                //     if (!err.statusCode) {
                //         err.statusCode = 500;
                //     }
                //     // next(err); // pass the error to the next error handling function
                // });



             // Get Vat for Counterparty Company
                const counterpartyCompany = new Vat ({
                        trx_id: trxId,
                        transaction_ref: trx_ref_provider,
                        cac_id: counterparty_company.cac_id,
                        transaction_type: trx_type,
                        trade_type: getOpposite(trade_type),
                        tin: counterparty_company.tin,
                        agent_tin: counterparty_company.tin, 
                        beneficiary_tin: counterparty_company.tin,
                        currency: 1,
                        transaction_amount: totalAmount,
                        vat: upperVat,
                        base_amount: upperCommission,
                        total_amount: upperCommission + upperVat,

                        lower_vat: lowerVat,
                        upper_vat: upperVat,
                        total_amount_lower: lowerCommission + lowerVat,
                        total_amount_upper: upperCommission + upperVat,

                        other_taxes: 0,
                        company_name: counterparty_company.company_name,
                        company_code: counterparty_company.company_code,
                        sector: sector,
                        sub_sector: 'STOCKBROKERS',
                        item_description: 'Stock trading',
                        transaction_date: trDate,
                        data_submitted: 0,
                        vat_rate: 7.5,
                        vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                        item_id: trxId + '2',
                        earning_type: 'Commission',
                        region: counterparty_company.region,
                        state: counterparty_company.state,
                        trans_threshold: counterparty_company.trans_threshold
                    });
    
                    await counterpartyCompany.save();
                    companyData.push (counterpartyCompany);
                    // submitDataToTaxPro(counterpartyCompany, bearerToken, false);

                    // await Promise.resolve(submitDataToTaxPro(counterpartyCompany, bearerToken, false))
                    // .then(response => 
                        
                    //     Vat.findOne({agent_tin: counterpartyCompany.agent_tin} && {trx_id: counterpartyCompany.trx_id})
                    //     .then(vatFound =>{
                    //     vatFound.taxpro_trans_id = trans_id;
                    //     vatFound.data_submitted = 1; 
                    //     vatFound.save();
    
                    //     console.log('Done Executing counterparty');
                    // }));


                // if (trade_type == 'Buy') {
                    // Get Vat for Sec
                        const sec = new Vat ({
                            trx_id: trxId,
                            transaction_ref: trx_ref_provider,
                            cac_id: sec_company.cac_id,
                            transaction_type: trx_type,
                            trade_type: 'Buy',
                            tin: sec_company.tin,
                            agent_tin: sec_company.tin, 
                            beneficiary_tin: sec_company.tin,
                            currency: 1,
                            transaction_amount: totalAmount,
                            vat: secVat,
                            base_amount: secFee,
                            total_amount: secFee + secVat,
    
                            lower_vat: secVat,
                            upper_vat: secVat,
                            total_amount_lower: secFee + secVat,
                            total_amount_upper: secVat + secVat,
    
                            other_taxes: 0,
                            company_name: sec_company.company_name, //main_company.company_name,
                            company_code: sec_company.company_code, // counterparty_company.company_code,
                            sector: sector,
                            sub_sector: 'SEC',
                            item_description: 'Stock trading',
                            transaction_date: trDate,
                            data_submitted: 0,
                            vat_rate: 7.5,
                            vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                            item_id: trxId + '3',
                            earning_type: 'Fee',
                            region: sec_company.region,
                            state: sec_company.state,
                            trans_threshold: sec_company.trans_threshold
                        });
        21
                        await sec.save();      
                        companyData.push (sec);
                      
                // }

                 // ********For sell orders*********
                //  if (trade_type == 'Sell') {
                    // Get Vat for NGX
                    const ngx = new Vat ({
                        trx_id: trxId,
                        transaction_ref: trx_ref_provider,
                        cac_id: ngx_company.cac_id,
                        transaction_type: trx_type,
                        trade_type: 'Sell',
                        tin: ngx_company.tin,
                        agent_tin: ngx_company.tin, 
                        beneficiary_tin: ngx_company.tin,
                        currency: 1,
                        transaction_amount: totalAmount,
                        vat: ngxVat,
                        base_amount: ngxFee,
                        total_amount: ngxFee + ngxVat,

                        lower_vat: ngxVat,
                        upper_vat: ngxVat,
                        total_amount_lower: ngxFee + ngxVat,
                        total_amount_upper: ngxVat + ngxVat,

                        other_taxes: 0,
                        company_name: ngx_company.company_name, //main_company.company_name,
                        company_code: ngx_company.company_code, // counterparty_company.company_code,
                        sector: sector,
                        sub_sector: 'NGX',
                        item_description: 'Stock trading',
                        transaction_date: trDate,
                        data_submitted: 0,
                        vat_rate: 7.5,
                        vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                        item_id: trxId + '4',
                        earning_type: 'Fee',
                        region: ngx_company.region,
                        state: ngx_company.state,
                        trans_threshold: ngx_company.trans_threshold
                    });
    
                    await ngx.save();    
                    companyData.push (ngx);
                    // submitDataToTaxPro(ngx, bearerToken, false);         
                    
                    // await Promise.resolve(submitDataToTaxPro(ngx, bearerToken, false))
                    // .then(response => 
                        
                    //     Vat.findOne({agent_tin: ngx.agent_tin} && {trx_id: ngx.trx_id})
                    //     .then(vatFound =>{
                    //     vatFound.taxpro_trans_id = trans_id;
                    //     vatFound.data_submitted = 1; 
                    //     vatFound.save();
    
                    //     console.log('Done Executing ngx');
                    // }));   
                    
                // Get Vat for CSCS
                const cscs = new Vat ({
                    trx_id: trxId,
                    transaction_ref: trx_ref_provider,
                    cac_id: cscs_company.cac_id,
                    transaction_type: trx_type,
                    trade_type: 'Sell',
                    tin: cscs_company.tin,
                    agent_tin: cscs_company.tin, 
                    beneficiary_tin: cscs_company.tin,
                    currency: 1,
                    transaction_amount: totalAmount,
                    vat: cscsVat,
                    base_amount: cscsFee,
                    total_amount: cscsFee + cscsVat,

                    lower_vat: cscsVat,
                    upper_vat: cscsVat,
                    total_amount_lower: cscsFee + cscsVat,
                    total_amount_upper: cscsVat + cscsVat,

                    other_taxes: 0,
                    company_name: cscs_company.company_name, //main_company.company_name,
                    company_code: cscs_company.company_code, // counterparty_company.company_code,
                    sector: sector,
                    sub_sector: 'CSCS',
                    item_description: 'Stock trading',
                    transaction_date: trDate,
                    data_submitted: 0,
                    vat_rate: 7.5,
                    vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                    item_id: trxId + '5',
                    earning_type: 'Fee',
                    region: cscs_company.region,
                    state: cscs_company.state,
                    trans_threshold: cscs_company.trans_threshold
                });

                await cscs.save();            
                companyData.push (cscs); 
                // submitDataToTaxPro(cscs, bearerToken, false);      

                
                // await Promise.resolve(submitDataToTaxPro(cscs, bearerToken, false))
                //     .then(response => 
                        
                //         Vat.findOne({agent_tin: cscs.agent_tin} && {trx_id: cscs.trx_id})
                //         .then(vatFound =>{
                //         vatFound.taxpro_trans_id = trans_id;
                //         vatFound.data_submitted = 1; 
                //         vatFound.save();
    
                //         console.log('Done Executing cscs');
                //     }));            
                
                // }

                
                // console.log('My Token::' + bearerToken);

                // console.log('record::' + dat + ', Trx ID::' + trxId);
                res.status(201).json({
                    message: 'Transaction saved successfully',
                    data: {trx_id: trxId,
                       
                        remarks: remarks      }
            })
        })
                
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
}

// ***** DASHBOARD  BEGINS ********


exports.getVatHourly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatbyhour');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate.setHours(firstDate.getHours() + 1);
   
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        if (!dat[0]) dat[0] = 0;


        // 2AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;
       
                // 3AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
        
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;


                // 4AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
         
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // 5AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // 6AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;
        
        // 7AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // 8AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // 9AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // 10AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        if (!dat9[0]) dat9[0] = 0;


        // 11AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        if (!dat10[0]) dat10[0] = 0;


        
        // 12PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        if (!dat11[0]) dat11[0] = 0;


        // 1PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat12 => {
        if (!dat12[0]) dat12[0] = 0;

        // 2PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        console.log('firstD::' + firstDate);
        console.log('lastD::' + lastDate);
        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat13 => {
        if (!dat13[0]) dat13[0] = 0;
       
        // 3PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat14 => {
        if (!dat14[0]) dat14[0] = 0;

        // 4PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat15 => {
        if (!dat15[0]) dat15[0] = 0;

        // 5PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat16 => {
        if (!dat16[0]) dat16[0] = 0;

        // 6PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat17 => {
        if (!dat17[0]) dat17[0] = 0;

        // 7PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat18 => {
        if (!dat18[0]) dat18[0] = 0;

        // 8PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat19 => {

        if (!dat19[0]) dat19[0] = 0;
        // 9PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat20 => {
        if (!dat20[0]) dat20[0] = 0;

        // 10PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat21 => {
        if (!dat21[0]) dat21[0] = 0;

        // 11PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat22 => {
        if (!dat22[0]) dat22[0] = 0;

        // 12AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat23 => {
        if (!dat23[0]) dat23[0] = 0;
    
    let arrData = [{'hour': '01', 'transactions': dat[0].totalSum || 0} , {'hour': '02', 'transactions': dat1[0].totalSum || 0}, {'hour': '03', 'transactions': dat2[0].totalSum || 0} , {'hour': '04', 'transactions': dat3[0].totalSum || 0} , {'hour': '05', 'transactions': dat4[0].totalSum || 0} , {'hour': '06', 'transactions': dat5[0].totalSum || 0}, 
    {'hour': '07', 'transactions': dat6[0].totalSum || 0}, {'hour': '08', 'transactions': dat7[0].totalSum || 0}, {'hour': '09', 'transactions': dat8[0].totalSum || 0}, {'hour': '10', 'transactions': dat9[0].totalSum || 0}, {'hour': '11', 'transactions': dat10[0].totalSum || 0}, {'hour': '12', 'transactions': dat11[0].totalSum || 0}, 
    {'hour': '13', 'transactions': dat12[0].totalSum || 0}, {'hour': '14', 'transactions': dat13[0].totalSum || 0}, {'hour': '15', 'transactions': dat14[0].totalSum || 0}, {'hour': '16', 'transactions': dat15[0].totalSum || 0}, {'hour': '17', 'transactions': dat16[0].totalSum || 0}, {'hour': '18', 'transactions': dat17[0].totalSum || 0}, 
    {'hour': '19', 'transactions': dat18[0].totalSum || 0}, {'hour': '20', 'transactions': dat19[0].totalSum || 0}, {'hour': '21', 'transactions': dat20[0].totalSum || 0}, {'hour': '22', 'transactions': dat21[0].totalSum || 0}, {'hour': '23', 'transactions': dat22[0].totalSum || 0}, {'hour': '24', 'transactions': dat23[0].totalSum || 0}];
       
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 
});
});
});
}); 
}); 
}); 
}); 
});
});
});
});
});
});
});
}


exports.getVatToday = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vattoday');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;

    console.log('dd: ' + dd + ' mm: ' + mm + ', yyyy: ' + yyyy);

    if (!dd || !mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    console.log('After dd: ' + dd + ' mm: ' + mm + ', yyyy: ' + yyyy);

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    firstDate.setHours(00, 00);
    lastDate.setHours(23, 59);
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);
        firstDate.setHours(00, 00);
        lastDate.setHours(23, 59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
       
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}



exports.getVatMonthly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatthismonth');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    
    if (!mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
    }
    
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
    var lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);

    lastDayOfMonth.setHours(23,59);
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }        
          
        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

function getQuarter(mm, yyyy) {
    var firstDate;
    var testDate;
    var lastDate;

console.log('Month in Fnct: ' + mm);
    switch(mm) {
        case 0:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
          return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 1:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
          return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 2:
            firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 2, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
           return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '1st Qtr'};
          break;
        case 3:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
           return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 4:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 5:
            firstDate = new Date(Date.UTC(yyyy, 3, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 5, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '2nd Qtr'};
          break;
        case 6:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 7:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 8:
            firstDate = new Date(Date.UTC(yyyy, 6, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 8, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '3rd Qtr'};
          break;
        case 9:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
        case 10:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
        case 11:
            firstDate = new Date(Date.UTC(yyyy, 9, 1, 00, 00, 00));
            testDate = new Date(Date.UTC(yyyy, 11, 1, 23, 50, 00));
            lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
            return {'firstDate': firstDate, 'lastDate': lastDate, 'qtr': '4th Qtr'};
          break;
       
      }
}


function getLastQuarter(mm, yyyy) {
    var firstDate;
    var testDate;
    var lastDate;

console.log('Month in Fnct: ' + mm);
    switch(mm) {
        case 0:
          return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 1:
            return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 2:
        
        return {'mm': 9, 'yyyy': yyyy -1, 'qtr': '4th Qtr'};
          break;
        case 3:
        
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 4:
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 5:
            return {'mm': 0, 'yyyy': yyyy, 'qtr': '1st Qtr'};
          break;
        case 6:
            
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 7:
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 8:
            return {'mm': 3, 'yyyy': yyyy, 'qtr': '2nd Qtr'};
          break;
        case 9:
           
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
        case 10:
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
        case 11:
            return {'mm': 6, 'yyyy': yyyy, 'qtr': '3rd Qtr'};
          break;
       
      }
}

exports.getVatQuarterly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatthisquarter');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    console.log('mm: ' + mm + ', yyyy: ' + yyyy );
    
    if (!mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
    }

    let qtrObject = getQuarter(mm, yyyy);
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        let lastQtrObject = getLastQuarter(mm, yyyy);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatYearly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatthisyear');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    // var sector = req.params.sector;
    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChange = 0;
          if (dat[0] && previous[0]) {
              percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
              percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getTrxYearlyAllSectors = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'yearsummaryforallsectors');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var yyyy = +req.params.yyyy;
    
    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
    }
        
        console.log('Log year: ' + yyyy);
        firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
        testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
        lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
    
        console.log('FirstD:' + firstDate);
        console.log('SecndD:' + lastDate);
    
         var sumValue = 0;
         var dadas = '';
          Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ]
          ).then (dat => {
    
            // calculate percentage
            if (dat) {
    
                for (i = 0; i < dat.length; i++){
                    sumValue += dat[i].totalSum;
                }
    
                for (i = 0; i < dat.length; i++) {
                    var ans = (dat[i].totalSum * 100)/sumValue;
                    var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                    dadas = dadas + tempview;
                }
    
                dadas = dadas.substring(0, dadas.length - 1);
                dadas = "{" + dadas + "}" ;
                console.log(dadas);
                var perc = JSON.parse(dadas);
    
            }
    
            res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
          })  .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })        
           
    }


var months = [];
function recursionGetByMonth(mm, yyyy) {

    if (mm == 0) {
        firstDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        testDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
    
        console.log('firstDate_0:' + mm + ' ' + firstDate);
        console.log('lastDate_0: '+ mm + ' ' + lastDate);
        
         var sumValue = 0;
         var dadas = '';
          Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ]
          ).then(dat => {
            let mnth = {mm: dat[0]};
            // console.log(mnth);
            // console.log(mnth.mm._id);
            months.push (mnth);
            console.log(months[0]);
            console.log('in-Recursion::' + months);
   
          })
          return months;
    } else {

        firstDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        testDate = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
        lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);
    
        console.log('firstDate_:' + firstDate);
        console.log('lastDate_: '+ lastDate);
        
         var sumValue = 0;
         var dadas = '';
          Transactionz.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ]
          ).then(dat => {
           let mnth = {mm: dat[0]};
           months.push (mnth);
           return recursionGetByMonth(mm - 1); //Call Recursive function

          })

        
    }
    
    
}


exports.getTrxMonthlyAllSectors = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'monthsummaryforallsectors');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var yyyy = +req.params.yyyy;
   
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        let repData = gulpData(dat);
        if (!dat[0]) dat[0] = 0;


        // February
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        let repData1 = gulpData(dat1);
        if (!dat1[0]) dat1[0] = 0;

       
                // March
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                let repData2 = gulpData(dat2);
                if (!dat2[0]) dat2[0] = 0;

                // April
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                let repData3 = gulpData(dat3);
                if (!dat3[0]) dat3[0] = 0;

        // May
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        let repData4 = gulpData(dat4);
        if (!dat4[0]) dat4[0] = 0;


        // June
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        let repData5 = gulpData(dat5);
        if (!dat5[0]) dat5[0] = 0;
        
        // July
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        let repData6 = gulpData(dat6);
        if (!dat6[0]) dat6[0] = 0;


        // August
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        let repData7 = gulpData(dat7);
        if (!dat7[0]) dat7[0] = 0;

        // September
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        let repData8 = gulpData(dat8);
        if (!dat8[0]) dat8[0] = 0;

        // October
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        let repData9 = gulpData(dat9);
        if (!dat9[0]) dat9[0] = 0;


        // November
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        let repData10 = gulpData(dat10);
        if (!dat10[0]) dat10[0] = 0;

        // December
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        let repData11 = gulpData(dat11);
        if (!dat11[0]) dat11[0] = 0;

        // let obj = 
    //     let arrData = [{"January": dat, "February": dat1, "March": dat2, "April": dat3, "May": dat4, "June": dat5, "July": dat6,
    // "August": dat7, "September": dat8, "October": dat9, "November": dat10, "December": dat11}];
       
    // let arrData = [{'month': 'January', 'transactions': dat[0].totalSum || 0} , {'month': 'February', 'transactions': dat1[0].totalSum || 0}, {'month': 'March', 'transactions': dat2[0].totalSum || 0} , {'month': 'April', 'transactions': dat3[0].totalSum || 0} , {'month': 'May', 'transactions': dat4[0].totalSum || 0} , {'month': 'June', 'transactions': dat5[0].totalSum || 0}, 
    // {'month': 'July', 'transactions': dat6[0].totalSum || 0}, {'month': 'August', 'transactions': dat7[0].totalSum || 0}, {'month': 'September', 'transactions': dat8[0].totalSum || 0}, {'month': 'October', 'transactions': dat9[0].totalSum || 0}, {'month': 'November', 'transactions': dat10[0].totalSum || 0}, {'month': 'December'}];
       

    let arrData = [
        {'month': 'January', 
        'Capital Market': repData.capital,
        'Insurance': repData.insurance
        },
        {'month': 'February', 
        'Capital Market': repData1.capital,
        'Insurance': repData1.insurance
        },
            
        {'month': 'March', 
        'Capital Market': repData2.capital,
        'Insurance': repData2.insurance
        },
        
        {'month': 'April', 
        'Capital Market': repData3.capital,
        'Insurance': repData3.insurance

        },
    
        {'month': 'May', 
        'Capital Market': repData4.capital,
        'Insurance': repData4.insurance

        },
    
    
        {'month': 'June', 
        'Capital Market': repData5.capital,
        'Insurance': repData5.insurance

        },
    
    
        {'month': 'July', 
        'Capital Market': repData6.capital,
        'Insurance': repData6.insurance

        },
    
        {'month': 'August', 
        'Capital Market': repData7.capital,
        'Insurance': repData7.insurance

        },
    
        {'month': 'September', 
        'Capital Market': repData8.capital,
        'Insurance': repData8.insurance

        },
    
        {'month': 'October', 
        'Capital Market': repData9.capital,
        'Insurance': repData9.insurance

        },
    
        {'month': 'November', 
        'Capital Market': repData10.capital,
        'Insurance': repData10.insurance

        },
    
        {'month': 'December', 
        'Capital Market': repData11.capital,
        'Insurance': repData11.insurance

        }];

        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
});  //End of February
}); // End of January
}); // End of March
}) //End of April
}) //End of May
}) //End of June
}) //End of July
}) //End of August
}) //End of September
}) //End of October
}


exports.getVatSegmentYearlyAllSector = (req, res, next) => { 
  const access = PM.routesmanager(req.user.userType, 'yearlyvatsegmentallsectors');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
    }
    

    // var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth() + 1, 0);

    console.log('firstDate :' + firstDate);
    console.log('lastDate :' + lastDate);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

         // Check Previous Year's  transactions
         firstDate.setFullYear(firstDate.getFullYear() - 1);
         lastDate.setFullYear(lastDate.getFullYear() - 1);
         var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
         
         lastDate2.setHours(23,59);
 
         console.log('sDate :' + firstDate);
         console.log('eDate :' + lastDate2);
         
         const previous = await Vat.aggregate([
             {
                 $match: {'createdAt': {
                     $gte: firstDate,
                     $lte: lastDate2}}
             },
             {
                 $group: {
     
                     _id: "$sector",
                     totalSum: { $sum: "$vat"},
                     count: { $sum: 1 }
                 }
             }
           ])
         
     
           var percentChange = 0;
           if (previous[0]) percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;

           for (i = 0; i < dat.length; i++) {
            for (let k = 0; k < previous.length; k++) {

                if (dat[i] && previous[k]) {
                                     
                    if (dat[i]._id === previous[k]._id) {
                        console.log('dat: ' + i + ':' + dat[i]._id + ', previous: ' + previous[k]._id);

                        var ans = ((dat[i].totalSum - previous[k].totalSum) / previous[k].totalSum) * 100;
                        var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                            dadas = dadas + tempview;
                    }
    
                    
                }
            }
            
        }
    
                dadas = dadas.substring(0, dadas.length - 1);
                dadas = "{" + dadas + "}" ;
                console.log(dadas);
                var perc = JSON.parse(dadas);
            
         
         res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: perc});        

        // res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getTransactionzWithPages = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'alltransactionwithpages');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    console.log('Page: ' + page);
    console.log('Limit: ' + limit);

        Vat.find({},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type region state')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Transactionz.count();
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}


exports.getVatYearlyByRegion = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatthisyearbyregion');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    // var sector = req.params.sector;
    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

    const firstDate = firstDayOfTheYear;
    const lastDate = lastDayOfTheYear;


    var firstDayOfTheYear2 = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate2 = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear2 = new Date(tempDate2.getFullYear(), tempDate2.getMonth() + 1, 0);
    lastDayOfTheYear2.setHours(23,59);


    
    firstDayOfTheYear2.setFullYear(firstDayOfTheYear2.getFullYear() - 1);
    const firstDate2 = firstDayOfTheYear2;
    lastDayOfTheYear2.setFullYear(lastDayOfTheYear2.getFullYear() - 1);
    var lastDate2 = new Date(lastDayOfTheYear2.getFullYear(), lastDayOfTheYear2.getMonth() + 1, 0);
        
    lastDate2.setHours(23,59);
    


    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);

    console.log('firstDate2:' + firstDate2);
    console.log('lastDate2: '+ lastDate2);

    
      Vat.aggregate([
       {
        $match: {'createdAt': {
            $gte: firstDate,
            $lte: lastDate}, 'region': 'NORTH WEST'}
    },
    {
        $group: {

            _id: "$_v",
            totalSum: { $sum: "$vat"},
            count: { $sum: 1 }
        }
    }
      ]).then (async NW => {

        
        const previousNW = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'region': "NORTH WEST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeNW = 0;
          if (NW[0] && previousNW[0]) {
              percentChangeNW = ((NW[0].totalSum - previousNW[0].totalSum) / previousNW[0].totalSum) * 100;
              percentChangeNW = percentChangeNW.toFixed(1);
          }
        // End of North West


        // PROCESS FOR NC 
        const NC  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'region': "NORTH CENTRAL"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!NC[0]) NC[0] = 0;

        
        const previousNC = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'region': "NORTH CENTRAL"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeNC = 0;
          if (NC[0] && previousNC[0]) {
              percentChangeNC = ((NC[0].totalSum - previousNC[0].totalSum) / previousNC[0].totalSum) * 100;
              percentChangeNC = percentChangeNC.toFixed(1);
          }
        // End of North Central


        // PROCESS FOR NE 
        const NE  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'region': "NORTH EAST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!NE[0]) NE[0] = 0;
      
        const previousNE = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'region': "NORTH EAST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeNE = 0;
          if (NE[0] && previousNE[0]) {
              percentChangeNE = ((NE[0].totalSum - previousNE[0].totalSum) / previousNE[0].totalSum) * 100;
              percentChangeNE = percentChangeNE.toFixed(1);
          }
        // End of North East


        // PROCESS FOR SW 
        const SW  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'region': "SOUTH WEST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!SW[0]) SW[0] = 0;
      
        const previousSW = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'region': "SOUTH WEST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeSW = 0;
          if (SW[0] && previousSW[0]) {
              percentChangeSW = ((SW[0].totalSum - previousSW[0].totalSum) / previousSW[0].totalSum) * 100;
              percentChangeSW = percentChangeSW.toFixed(1);
          }
        // End of South West

        // PROCESS FOR SE 
        const SE  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'region': "SOUTH EAST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!SE[0]) SE[0] = 0;
      
        const previousSE = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'region': "SOUTH EAST"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeSE = 0;
          if (SE[0] && previousSE[0]) {
              percentChangeSE = ((SE[0].totalSum - previousSE[0].totalSum) / previousSE[0].totalSum) * 100;
              percentChangeSE = percentChangeSE.toFixed(1);
          }
        // End of South East

        // PROCESS FOR SS 
        const SS  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'region': "SOUTH SOUTH"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!SS[0]) SS[0] = 0;
      
        const previousSS = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'region': "SOUTH SOUTH"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeSS = 0;
          if (SS[0] && previousSS[0]) {
              percentChangeSS = ((SS[0].totalSum - previousSS[0].totalSum) / previousSS[0].totalSum) * 100;
              percentChangeSS = percentChangeSS.toFixed(1);
          }
        // End of South East

        let NorthWest = {thisYear: NW, lastYear: previousNW, percentChange: percentChangeNW};
        let NorthCentral = {thisYear: NC, lastYear: previousNC, percentChange: percentChangeNC};
        let NorthEast = {thisYear: NE, lastYear: previousNE, percentChange: percentChangeNE};
        let SouthWest = {thisYear: SW, lastYear: previousSW, percentChange: percentChangeSW};
        let SouthEast = {thisYear: SE, lastYear: previousSE, percentChange: percentChangeSE};
        let SouthSouth = {thisYear: SS, lastYear: previousSS, percentChange: percentChangeSS};


        // res.status(200).json({message: 'success', thisYear: NW, lastYear: previousNW, percentChangeNW: percentChangeNW});        
        res.status(200).json({message: 'success', NorthWest: NorthWest, NorthCentral: NorthCentral, NorthEast: NorthEast, SouthWest: SouthWest, SouthEast: SouthEast, SouthSouth: SouthSouth});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatYearlyByThreshold = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatthisyearbythreshold');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    // var sector = req.params.sector;
    var yyyy = +req.params.yyyy;

    if (!yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
        const dd = today.getDate();
    }
    
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

    const firstDate = firstDayOfTheYear;
    const lastDate = lastDayOfTheYear;


    var firstDayOfTheYear2 = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate2 = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear2 = new Date(tempDate2.getFullYear(), tempDate2.getMonth() + 1, 0);
    lastDayOfTheYear2.setHours(23,59);


    
    firstDayOfTheYear2.setFullYear(firstDayOfTheYear2.getFullYear() - 1);
    const firstDate2 = firstDayOfTheYear2;
    lastDayOfTheYear2.setFullYear(lastDayOfTheYear2.getFullYear() - 1);
    var lastDate2 = new Date(lastDayOfTheYear2.getFullYear(), lastDayOfTheYear2.getMonth() + 1, 0);
        
    lastDate2.setHours(23,59);
    


    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);

    console.log('firstDate2:' + firstDate2);
    console.log('lastDate2: '+ lastDate2);

    // MTO
      Vat.aggregate([
       {
        $match: {'createdAt': {
            $gte: firstDate,
            $lte: lastDate}, 'trans_threshold': 'MTO'}
    },
    {
        $group: {

            _id: "$_v",
            totalSum: { $sum: "$vat"},
            count: { $sum: 1 }
        }
    }
      ]).then (async MTO => {

        
        const previousMTO = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'trans_threshold': "MTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeMTO = 0;
          if (MTO[0] && previousMTO[0]) {
              percentChangeMTO = ((MTO[0].totalSum - previousMTO[0].totalSum) / previousMTO[0].totalSum) * 100;
              percentChangeMTO = percentChangeMTO.toFixed(1);
          }
        // End of North West


        // PROCESS FOR GBTO
        const GBTO  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'trans_threshold': "GBTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!GBTO[0]) GBTO[0] = 0;

        
        const previousGBTO = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'trans_threshold': "GBTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeGBTO = 0;
          if (GBTO[0] && previousGBTO[0]) {
              percentChangeGBTO = ((GBTO[0].totalSum - previousGBTO[0].totalSum) / previousGBTO[0].totalSum) * 100;
              percentChangeGBTO = percentChangeGBTO.toFixed(1);
          }
        // End of North Central


        // PROCESS FOR DMO 
        const DMO  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'trans_threshold': "DMO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!DMO[0]) DMO[0] = 0;
      
        const previousDMO = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'trans_threshold': "DMO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeDMO = 0;
          if (DMO[0] && previousDMO[0]) {
              percentChangeDMO = ((DMO[0].totalSum - previousDMO[0].totalSum) / previousDMO[0].totalSum) * 100;
              percentChangeDMO = percentChangeDMO.toFixed(1);
          }
        // End of North East


        // PROCESS FOR LTO 
        const LTO  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'trans_threshold': "LTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!LTO[0]) LTO[0] = 0;
      
        const previousLTO = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'trans_threshold': "LTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeLTO = 0;
          if (LTO[0] && previousLTO[0]) {
              percentChangeLTO = ((LTO[0].totalSum - previousLTO[0].totalSum) / previousLTO[0].totalSum) * 100;
              percentChangeLTO = percentChangeLTO.toFixed(1);
          }
        // End of South West

        // PROCESS FOR MSTO 
        const MSTO  = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'trans_threshold': "MSTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        if (!MSTO[0]) MSTO[0] = 0;
      
        const previousMSTO = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'trans_threshold': "MSTO"}
            },
            {
                $group: {
    
                    _id: "$_v",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
          var percentChangeMSTO = 0;
          if (MSTO[0] && previousMSTO[0]) {
              percentChangeMSTO = ((MSTO[0].totalSum - previousMSTO[0].totalSum) / previousMSTO[0].totalSum) * 100;
              percentChangeMSTO = percentChangeMSTO.toFixed(1);
          }
        // End of South East

        // // PROCESS FOR SS 
        // const SS  = await Vat.aggregate([
        //     {
        //         $match: {'createdAt': {
        //             $gte: firstDate,
        //             $lte: lastDate}, 'region': "SOUTH SOUTH"}
        //     },
        //     {
        //         $group: {
    
        //             _id: "$_v",
        //             totalSum: { $sum: "$vat"},
        //             count: { $sum: 1 }
        //         }
        //     }
        //   ])
        // if (!SS[0]) SS[0] = 0;
      
        // const previousSS = await Vat.aggregate([
        //     {
        //         $match: {'createdAt': {
        //             $gte: firstDate,
        //             $lte: lastDate2}, 'region': "SOUTH SOUTH"}
        //     },
        //     {
        //         $group: {
    
        //             _id: "$_v",
        //             totalSum: { $sum: "$vat"},
        //             count: { $sum: 1 }
        //         }
        //     }
        //   ])
        
        //   var percentChangeSS = 0;
        //   if (SS[0] && previousSS[0]) {
        //       percentChangeSS = ((SS[0].totalSum - previousSS[0].totalSum) / previousSS[0].totalSum) * 100;
        //       percentChangeSS = percentChangeSS.toFixed(1);
        //   }
        // // End of South East

        let threshMTO = {thisYear: MTO, lastYear: previousMTO, percentChange: percentChangeMTO};
        let threshGBTO = {thisYear: GBTO, lastYear: previousGBTO, percentChange: percentChangeGBTO};
        let threshDMO = {thisYear: DMO, lastYear: previousDMO, percentChange: percentChangeDMO};
        let threshLTO = {thisYear: LTO, lastYear: previousLTO, percentChange: percentChangeLTO};
        let threshMSTO = {thisYear: MSTO, lastYear: previousMSTO, percentChange: percentChangeMSTO};
        // let SouthSouth = {thisYear: SS, lastYear: previousSS, percentChange: percentChangeSS};


        // res.status(200).json({message: 'success', thisYear: NW, lastYear: previousNW, percentChangeNW: percentChangeNW});        
        res.status(200).json({message: 'success', MTO: threshMTO, GBTO: threshGBTO, DMO: threshDMO, LTO: threshLTO, MSTO: threshMSTO});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}
// ***** DASHBOARD  ENDS ********


// ***** SECTOR- CAPITAL MARKET, INSURANCE BEGINS ********

exports.getVatTodayBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vattodaybysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var sector = req.params.sector;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 23, 59, 00));
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

function setToMonday( date ) {
    var day = date.getDay() || 7;  

    if( day !== 1 ) 
        date.setHours(-24 * (day - 1)); 
    return date;
}

exports.getVatWeeklyBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatweeklybysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var sector = req.params.sector;
    const today = new Date();
   
    var mondayDate = setToMonday(today);
    
    const yyyy1 = mondayDate.getFullYear();
    const mm1 = mondayDate.getMonth();
    const dd1 = mondayDate.getDate();
    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));

    var sundayDate = setToMonday(today);
    sundayDate.setDate(sundayDate.getDate() + 5);
    const yyyy2 = sundayDate.getFullYear();
    const mm2 = sundayDate.getMonth();
    const dd2 = sundayDate.getDate();

    
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 23, 59, 00));
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous week's  transaction
        firstDate.setDate(firstDate.getDate() - 7);
        lastDate.setDate(lastDate.getDate() - 7);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
          }

        res.status(200).json({message: 'success', thisWeek: dat, lastWeek: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatMonthlyBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'monthlyvatsegmentbysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    console.log('Got Hiaaa');
    var sector = req.params.sector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    console.log('Sector:' + sector);
    console.log('Today:' + today);
    console.log('dd' + dd + ', mm:' + mm + ', year: ' + yyyy);
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));

    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    lastDayOfMonth.setHours(23,59);

  
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfMonth);
    console.log('lastDate: '+ lastDayOfMonth);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous month's  transaction
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        // lastDate = lastDayOfMonth;
        // var d = new Date(2023, lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
          

        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getVatQuarterlyBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatquarterlybysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var sector = req.params.sector;
    
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    let qtrObject = getQuarter(mm, yyyy);  
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {
        let lastQtrObject = getLastQuarter(mm, yyyy);
        console.log('Last QT bjt:: ' + lastQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
    
          var percentChange = 0;
          if (dat[0] && previous[0]) { 
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
        }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatYearlyBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatyearlybysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var sector = req.params.sector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous Year's  transactions
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getMarketSegmentYearly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'yearlymarketsegmentbysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    const today = new Date();
    const yyyy = today.getFullYear();
    var mm = today.getMonth();
    const dd = today.getDate();

    var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$transaction_amount"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {

        // calculate percentage
        if (dat) {

            for (i = 0; i < dat.length; i++){
                sumValue += dat[i].totalSum;
            }

            for (i = 0; i < dat.length; i++) {
                var ans = (dat[i].totalSum * 100)/sumValue;
                var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                dadas = dadas + tempview;
            }

            dadas = dadas.substring(0, dadas.length - 1);
            dadas = "{" + dadas + "}" ;
            console.log(dadas);
            var perc = JSON.parse(dadas);

        }

        res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}
            
// nested functions
exports.getVatMonthlyBySectorAllSubsector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'monthlyvatsegmentbysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var yyyy = +req.params.yyyy;
    var sector = req.params.sector;
    console.log('Sector: ' + sector + 'Year: ' + yyyy);
   
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        let resData = findData(dat);

        if (!dat[0]) dat[0] = 0;

        // February
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        let resData1 = findData(dat1);
        if (!dat1[0]) dat1[0] = 0;

                // March
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                let resData2 = findData(dat2);
                if (!dat2[0]) dat2[0] = 0;

                // April
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                let resData3 = findData(dat3);
                if (!dat3[0]) dat3[0] = 0;

        // May
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        let resData4 = findData(dat4);
        if (!dat4[0]) dat4[0] = 0;


        // June
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        let resData5 = findData(dat5);
        if (!dat5[0]) dat5[0] = 0;

        // July
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        let resData6 = findData(dat6);
        if (!dat6[0]) dat6[0] = 0;


        // August
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        let resData7 = findData(dat7);
        if (!dat7[0]) dat7[0] = 0;

        // September
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        let resData8 = findData(dat8);
        if (!dat8[0]) dat8[0] = 0;

        // October
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        let resData9 = findData(dat9);
        if (!dat9[0]) dat9[0] = 0;

        // November
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        let resData10 = findData(dat10);
        if (!dat10[0]) dat10[0] = 0;

        // December
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        let resData11 = findData(dat11);
        if (!dat11[0]) dat11[0] = 0;

        // let obj = 
    //     let arrData = [{"January": dat, "February": dat1, "March": dat2, "April": dat3, "May": dat4, "June": dat5, "July": dat6,
    // "August": dat7, "September": dat8, "October": dat9, "November": dat10, "December": dat11}];

    
   

    let arrData = [
    {'month': 'January', 
    'NGX': resData.ngx,
    'CSCS': resData.cscs,
    'SEC': resData.sec,
    'STOCKBROKERS': resData.stockbrokers
    },
    {'month': 'February', 
    'NGX': resData1.ngx,
    'CSCS': resData1.cscs,
    'SEC': resData1.sec,
    'STOCKBROKERS': resData1.stockbrokers
    },
        
    {'month': 'March', 
    'NGX': resData2.ngx,
    'CSCS': resData2.cscs,
    'SEC': resData2.sec,
    'STOCKBROKERS': resData2.stockbrokers
    },
    
    {'month': 'April', 
    'NGX': resData3.ngx,
    'CSCS': resData3.cscs,
    'SEC': resData3.sec,
    'STOCKBROKERS': resData3.stockbrokers
    },

    {'month': 'May', 
    'NGX': resData4.ngx,
    'CSCS': resData4.cscs,
    'SEC': resData4.sec,
    'STOCKBROKERS': resData4.stockbrokers
    },


    {'month': 'June', 
    'NGX': resData5.ngx,
    'CSCS': resData5.cscs,
    'SEC': resData5.sec,
    'STOCKBROKERS': resData5.stockbrokers
    },


    {'month': 'July', 
    'NGX': resData6.ngx,
    'CSCS': resData6.cscs,
    'SEC': resData6.sec,
    'STOCKBROKERS': resData6.stockbrokers
    },

    {'month': 'August', 
    'NGX': resData7.ngx,
    'CSCS': resData7.cscs,
    'SEC': resData7.sec,
    'STOCKBROKERS': resData7.stockbrokers
    },

    {'month': 'September', 
    'NGX': resData8.ngx,
    'CSCS': resData8.cscs,
    'SEC': resData8.sec,
    'STOCKBROKERS': resData8.stockbrokers
    },

    {'month': 'October', 
    'NGX': resData9.ngx,
    'CSCS': resData9.cscs,
    'SEC': resData9.sec,
    'STOCKBROKERS': resData9.stockbrokers
    },

    {'month': 'November', 
    'NGX': resData10.ngx,
    'CSCS': resData10.cscs,
    'SEC': resData10.sec,
    'STOCKBROKERS': resData10.stockbrokers
    },

    {'month': 'December', 
    'NGX': resData11.ngx,
    'CSCS': resData11.cscs,
    'SEC': resData11.sec,
    'STOCKBROKERS': resData11.stockbrokers
    }];
       

        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
});  //End of February
}); // End of January
}); // End of March
}) //End of April
}) //End of May
}) //End of June
}) //End of July
}) //End of August
}) //End of September
}) //End of October
}

function findData (x) {
    let ans;
    let sec = 0;
    let cscs = 0;
    let ngx = 0;
    let stockbrokers = 0;


    for (var i = 0; i < x.length; i++){

        if (x[i]._id === 'SEC') sec = x[i].totalSum;
        if (x[i]._id === 'CSCS') cscs = x[i].totalSum;
        if (x[i]._id === 'NGX') ngx = x[i].totalSum;
        if (x[i]._id === 'STOCKBROKERS') stockbrokers = x[i].totalSum;

    }

    let ansObj = {sec: sec, cscs: cscs, ngx: ngx, stockbrokers: stockbrokers}
return ansObj;
}


function gulpData (x) {
    let ans;
    let capital = 0;
    let insurance = 0;
    

    for (var i = 0; i < x.length; i++){

        if (x[i]._id === 'Capital Market') capital = x[i].totalSum;
        if (x[i]._id === 'Insurance') insurance = x[i].totalSum;
    }

    let ansObj = {capital: capital, insurance: insurance}
return ansObj;
}


exports.getVatMonthlyBySectorInsurance = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'monthlyvatsegmentbysectorInsurance');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var yyyy = +req.params.yyyy;
    var sector = req.params.sector;
    console.log('Sector: ' + sector + 'Year: ' + yyyy);
   
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    // console.log('firstDate:' + firstDate);
    // console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        let resDat = findData2(dat);

        if (!dat[0]) dat[0] = 0;

        // February
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        let resDat1 = findData2(dat1);
        if (!dat1[0]) dat1[0] = 0;

                // March
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                let resDat2 = findData2(dat2);
                if (!dat2[0]) dat2[0] = 0;

                // April
                firstDate.setMonth(firstDate.getMonth() + 1);
                lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sector': sector}
                },
                {
                    $group: {
        
                        _id: "$sub_sector",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                let resDat3 = findData2(dat3);
                if (!dat3[0]) dat3[0] = 0;

        // May
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        let resDat4 = findData2(dat4);
        if (!dat4[0]) dat4[0] = 0;


        // June
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        let resDat5 = findData2(dat5);
        if (!dat5[0]) dat5[0] = 0;

        // July
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        let resDat6 = findData2(dat6);
        if (!dat6[0]) dat6[0] = 0;


        // August
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        let resDat7 = findData2(dat7);
        if (!dat7[0]) dat7[0] = 0;

        // September
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        let resDat8 = findData2(dat8);
        if (!dat8[0]) dat8[0] = 0;

        // October
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        let resDat9 = findData2(dat9);
        if (!dat9[0]) dat9[0] = 0;

        // November
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        let resDat10 = findData2(dat10);
        if (!dat10[0]) dat10[0] = 0;

        // December
        firstDate.setMonth(firstDate.getMonth() + 1);
        lastDate = new Date(firstDate.getFullYear(), firstDate.getMonth()+1, 0);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        let resDat11 = findData2(dat11);
        if (!dat11[0]) dat11[0] = 0;

        // let obj = 
    //     let arrData = [{"January": dat, "February": dat1, "March": dat2, "April": dat3, "May": dat4, "June": dat5, "July": dat6,
    // "August": dat7, "September": dat8, "October": dat9, "November": dat10, "December": dat11}];

    
   

    let arrData = [
    {'month': 'January', 
    'NAICOM': resDat.naicom,
    'PENSION': resDat.pension
    },
    {'month': 'February', 
    'NAICOM': resDat1.naicom,
    'PENSION': resDat1.pension
    },
        
    {'month': 'March', 
    'NAICOM': resDat2.naicom,
    'PENSION': resDat2.pension
    },
    
    {'month': 'April', 
    'NAICOM': resDat3.naicom,
    'PENSION': resDat3.pension
    },

    {'month': 'May', 
    'NAICOM': resDat4.naicom,
    'PENSION': resDat4.pension
    },

    {'month': 'June', 
    'NAICOM': resDat5.naicom,
    'PENSION': resDat5.pension
    },


    {'month': 'July', 
    'NAICOM': resDat6.naicom,
    'PENSION': resDat6.pension
    },

    {'month': 'August', 
    'NAICOM': resDat7.naicom,
    'PENSION': resDat7.pension
    },

    {'month': 'September', 
    'NAICOM': resDat8.naicom,
    'PENSION': resDat8.pension
    },

    {'month': 'October', 
    'NAICOM': resDat9.naicom,
    'PENSION': resDat9.pension
    },

    {'month': 'November', 
    'NAICOM': resDat10.naicom,
    'PENSION': resDat10.pension
    },

    {'month': 'December', 
    'NAICOM': resDat11.naicom,
    'PENSION': resDat11.pension
    }];
       

        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
});  //End of February
}); // End of January
}); // End of March
}) //End of April
}) //End of May
}) //End of June
}) //End of July
}) //End of August
}) //End of September
}) //End of October
}

function findData2 (x) {
    let ans;
    let naicom = 0;
    let pension = 0;
    

    for (var i = 0; i < x.length; i++){

        if (x[i]._id === 'NAICOM') naicom = x[i].totalSum;
        if (x[i]._id === 'PENSION') pension = x[i].totalSum;
        

    }

    let ansObj = {naicom: naicom, pension: pension}
return ansObj;
}

exports.getVatSegmentYearlyBySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'yearlyvatsegmentbysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    const today = new Date();
    const yyyy = today.getFullYear();
    var mm = today.getMonth();
    const dd = today.getDate();

    var sector = req.params.sector;
    firstDate = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    testDate = new Date(Date.UTC(yyyy, 11, 1, 00, 00, 00));
    lastDate = new Date(testDate.getFullYear(), testDate.getMonth()+1, 0);

    lastDate.setHours(23, 59);
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

              // Check Previous Year's  transactions
         firstDate.setFullYear(firstDate.getFullYear() - 1);
         lastDate.setFullYear(lastDate.getFullYear() - 1);
         var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
         
         lastDate2.setHours(23,59);
 
         console.log('sDate :' + firstDate);
         console.log('eDate :' + lastDate2);
         
      
 
         const previous = await Vat.aggregate([
             {
                 $match: {'createdAt': {
                     $gte: firstDate,
                     $lte: lastDate2}, 'sector': sector}
             },
             {
                 $group: {
     
                     _id: "$sub_sector",
                     totalSum: { $sum: "$vat"},
                     count: { $sum: 1 }
                 }
             }
           ])
         
         
           // calculate percentage change 
           //   Formula
           //   ((newPrice - oldPrice)/oldPrice) * 100
           var percentChange = 0;
           var perc = 0;
           if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
           
           for (i = 0; i < dat.length; i++) {
            if (dat[i] && previous[i]) {
                var ans = ((dat[i].totalSum - previous[i].totalSum) / previous[i].totalSum) * 100;
                var tempview = "\"" + dat[i]._id + "\"" +":" + ans.toFixed(2) + ',';
                    dadas = dadas + tempview;
            }
        }
    
                dadas = dadas.substring(0, dadas.length - 1);
                dadas = "{" + dadas + "}" ;
                console.log(dadas);
                perc = JSON.parse(dadas);
    }
         
         res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: perc});        

        // res.status(200).json({message: 'success', data: dat, marketCap: sumValue, percent: perc});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}


exports.getSectorTransactionzWithPages = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'sectortransactionwithpages');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    var sector = req.params.sector;


    console.log('Page: ' + page);
    console.log('Limit: ' + limit);
    console.log('Sector:' + sector);
// sector = 'Insurance';
        Vat.find({},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region').where({'sector': sector})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'sector': sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);
            
            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

// *****END OF SECTORS ******


// *****SUB SECTORS- SEC, NGX, NAICOM etc ******

exports.getVatTodayBySubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vattodaybysubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var subsector = req.params.subsector;
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 23, 59, 00));
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous day's  transaction
        firstDate.setDate(firstDate.getDate() - 1);
        lastDate.setDate(lastDate.getDate() - 1);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate);

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
        if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
        }

        res.status(200).json({message: 'success', today: dat, yesterday: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatMonthlyBySubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatmonthlybysubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var subsector = req.params.subsector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));

    var lastDayOfMonth = new Date(today.getFullYear(), today.getMonth()+1, 0);
    lastDayOfMonth.setHours(23,59);

  
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfMonth);
    console.log('lastDate: '+ lastDayOfMonth);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous month's  transaction
        firstDate.setMonth(firstDate.getMonth() - 1);
        lastDate.setMonth(lastDate.getMonth() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        // lastDate = lastDayOfMonth;
        // var d = new Date(2023, lastDate.getMonth() + 1, 0);
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
          

        res.status(200).json({message: 'success', thisMonth: dat, lastMonth: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatQuarterlyBySubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatquarterlybysubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var subsector = req.params.subsector;
    
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    let qtrObject = getQuarter(mm, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        // console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Last Qtr's  transaction

        let lastQtrObject = getLastQuarter(mm, yyyy);
        console.log('Last QT bjt:: ' + lastQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(lastQtrObject.mm, lastQtrObject.yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('Last qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) { 
          percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
          percentChange = percentChange.toFixed(1);
        }
        
        res.status(200).json({message: 'success', thisQuarter: dat, lastQuarter: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatYearlyBySubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatyearlybysubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var subsector = req.params.subsector;
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = today.getMonth();
    const dd = today.getDate();
    
    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (async dat => {

        // Check Previous Year's  transactions
        firstDate.setFullYear(firstDate.getFullYear() - 1);
        lastDate.setFullYear(lastDate.getFullYear() - 1);
        var lastDate2 = new Date(lastDate.getFullYear(), lastDate.getMonth() + 1, 0);
        
        lastDate2.setHours(23,59);

        console.log('sDate :' + firstDate);
        console.log('eDate :' + lastDate2);
        
     

        const previous = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate,
                    $lte: lastDate2}, 'sub_sector': subsector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
        
        
          // calculate percentage change 
          //   Formula
          //   ((newPrice - oldPrice)/oldPrice) * 100
          var percentChange = 0;
          if (dat[0] && previous[0]) {
            percentChange = ((dat[0].totalSum - previous[0].totalSum) / previous[0].totalSum) * 100;
            percentChange = percentChange.toFixed(1);
          }
        
        res.status(200).json({message: 'success', thisYear: dat, lastYear: previous, percentChange: percentChange});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getVatHourlyBySubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vathourbysubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd = +req.params.dd;
    var mm = +req.params.mm;
    var yyyy = +req.params.yyyy;
    var subsector = req.params.subsector;

    firstDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate = new Date(Date.UTC(yyyy, mm, dd, 00, 00, 00));
    lastDate.setHours(firstDate.getHours() + 1);
    
     var sumValue = 0;
     var dadas = '';
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {
        if (!dat[0]) dat[0] = 0;


        // 2AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

    // console.log('firstDate1:' + firstDate);
    // console.log('lastDate1: '+ lastDate);
    
    Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat1 => {
        if (!dat1[0]) dat1[0] = 0;
       
                // 3AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
        
            // console.log('firstDate1:' + firstDate);
            // console.log('lastDate1: '+ lastDate);
            
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sub_sector': subsector}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat2 => {
                if (!dat2[0]) dat2[0] = 0;


                // 4AM
                firstDate.setHours(firstDate.getHours() + 1);
                lastDate.setHours(lastDate.getHours() + 1);
         
             var sumValue = 0;
             var dadas = '';
             Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}, 'sub_sector': subsector}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalSum: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
              ]
              ).then (dat3 => {
                if (!dat3[0]) dat3[0] = 0;

        // 5AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat4 => {
        if (!dat4[0]) dat4[0] = 0;


        // 6AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

     var sumValue = 0;
     var dadas = '';
     Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat5 => {
        if (!dat5[0]) dat5[0] = 0;
        
        // 7AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat6 => {
        if (!dat6[0]) dat6[0] = 0;


        // 8AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat7 => {
        if (!dat7[0]) dat7[0] = 0;

        // 9AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat8 => {
        if (!dat8[0]) dat8[0] = 0;

        // 10AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat9 => {
        if (!dat9[0]) dat9[0] = 0;


        // 11AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat10 => {
        if (!dat10[0]) dat10[0] = 0;


        
        // 12PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat11 => {
        if (!dat11[0]) dat11[0] = 0;


        // 1PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat12 => {
        if (!dat12[0]) dat12[0] = 0;

        // 2PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);

        console.log('firstD::' + firstDate);
        console.log('lastD::' + lastDate);
        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat13 => {
        if (!dat13[0]) dat13[0] = 0;

        // 3PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat14 => {
        if (!dat14[0]) dat14[0] = 0;

        // 4PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat15 => {
        if (!dat15[0]) dat15[0] = 0;

        // 5PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat16 => {
        if (!dat16[0]) dat16[0] = 0;

        // 6PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat17 => {
        if (!dat17[0]) dat17[0] = 0;

        // 7PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat18 => {
        if (!dat18[0]) dat18[0] = 0;

        // 8PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat19 => {

        if (!dat19[0]) dat19[0] = 0;
        // 9PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat20 => {
        if (!dat20[0]) dat20[0] = 0;

        // 10PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat21 => {
        if (!dat21[0]) dat21[0] = 0;

        // 11PM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat22 => {
        if (!dat22[0]) dat22[0] = 0;

        // 12AM
        firstDate.setHours(firstDate.getHours() + 1);
        lastDate.setHours(lastDate.getHours() + 1);


        Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sub_sector': subsector}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat23 => {
        if (!dat23[0]) dat23[0] = 0;


        // let obj = 
    //     let arrData = [{"1AM": dat, "2AM": dat1, "3AM": dat2, "4AM": dat3, "5AM": dat4, "6AM": dat5, "7AM": dat6,
    // "8AM": dat7, "9AM": dat8, "10AM": dat9, "11AM": dat10, "12PM": dat11, "1PM": dat12, "2PM": dat13, "3PM": dat14, 
    // "4PM": dat15, "5PM": dat16, "6PM": dat17, "7PM": dat18, "8PM": dat19, "9PM": dat20, "10PM": dat21, "11PM": dat22, "12AM": dat23}];

    let arrData = [{'hour': '01', 'transactions': dat[0].totalSum || 0} , {'hour': '02', 'transactions': dat1[0].totalSum || 0}, {'hour': '03', 'transactions': dat2[0].totalSum || 0} , {'hour': '04', 'transactions': dat3[0].totalSum || 0} , {'hour': '05', 'transactions': dat4[0].totalSum || 0} , {'hour': '06', 'transactions': dat5[0].totalSum || 0}, 
    {'hour': '07', 'transactions': dat6[0].totalSum || 0}, {'hour': '08', 'transactions': dat7[0].totalSum || 0}, {'hour': '09', 'transactions': dat8[0].totalSum || 0}, {'hour': '10', 'transactions': dat9[0].totalSum || 0}, {'hour': '11', 'transactions': dat10[0].totalSum || 0}, {'hour': '12', 'transactions': dat11[0].totalSum || 0}, 
    {'hour': '13', 'transactions': dat12[0].totalSum || 0}, {'hour': '14', 'transactions': dat13[0].totalSum || 0}, {'hour': '15', 'transactions': dat14[0].totalSum || 0}, {'hour': '16', 'transactions': dat15[0].totalSum || 0}, {'hour': '17', 'transactions': dat16[0].totalSum || 0}, {'hour': '18', 'transactions': dat17[0].totalSum || 0}, 
    {'hour': '19', 'transactions': dat18[0].totalSum || 0}, {'hour': '20', 'transactions': dat19[0].totalSum || 0}, {'hour': '21', 'transactions': dat20[0].totalSum || 0}, {'hour': '22', 'transactions': dat21[0].totalSum || 0}, {'hour': '23', 'transactions': dat22[0].totalSum || 0}, {'hour': '24', 'transactions': dat23[0].totalSum || 0}];
       
       
        // res.status(200).json({message: 'success', data: dat, dat1: dat1, dat2: dat2, dat3: dat3, dat4: dat4, dat5: dat5, dat6: dat6, dat7: dat7, dat8: dat8, dat9: dat9, dat10: dat10, dat11: dat11});        
        res.status(200).json({message: 'success', data: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
});
}); 
}); 
}); 
}); 
}); 
}); 
}); 
}); 
});
});
});
}); 
}); 
}); 
}); 
});
});
});
});
});
});
});
}

exports.getSubSectorTransactionzWithPages = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'subsectortransactionwithpages');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }


    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    var subsector = req.params.subsector;


    console.log('Page: ' + page);
    console.log('Limit: ' + limit);
    console.log('subSector:' + subsector);
// sector = 'Insurance';
        Vat.find({},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region').where ({'sub_sector': subsector})
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'sub_sector': subsector});
            

            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}


// 1st, 2nd , 3rd and 4th Qtr summary of reports
exports.getVatQuarter1234BySector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatquarter1234bysector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var sector = req.params.sector;
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = today.getMonth();
    var dd = today.getDate();

    // 1st Quarter
    let qtrObject = getQuarter(1, yyyy);
    
    // console.time('T1');
    
        var firstDate = qtrObject.firstDate;
        var lastDate = qtrObject.lastDate;
        console.log(' qtr:' + qtrObject.qtr);
    // console.timeEnd('T1');

    console.log('firstDate:' + firstDate);
    console.log('lastDate: '+ lastDate);
    
      Vat.aggregate([
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}, 'sector': sector}
        },
        {
            $group: {

                _id: "$sub_sector",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]).then (async dat => {
        if (!dat[0]) dat[0] = 0;

        // Check 2nd Qtr's transaction

        // let secondQtrObject = getQuarter(3, yyyy);
        // console.log('Last QT bjt:: ' + secondQtrObject.mm + ':' + lastQtrObject.yyyy + ':' + lastQtrObject.qtr);
        let qtrObject2 = getQuarter(3, yyyy);
        var firstDate2 = qtrObject2.firstDate;
        var lastDate2 = qtrObject2.lastDate;
        console.log('2nd qtr:' + qtrObject2.qtr);

        console.log('sDate :' + firstDate2);
        console.log('eDate :' + lastDate2);
        
        const secondQtr = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate2,
                    $lte: lastDate2}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])
          if (!secondQtr[0]) secondQtr[0] = 0;

        //   Get the third qtr data
            let qtrObject3 = getQuarter(6, yyyy);
        var firstDate3 = qtrObject3.firstDate;
        var lastDate3 = qtrObject3.lastDate;
        console.log('3rd qtr:' + qtrObject3.qtr);

        console.log('sDate3 :' + firstDate3);
        console.log('eDate3 :' + lastDate3);
        
        const thirdQtr = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate3,
                    $lte: lastDate3}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])

          if (!thirdQtr[0]) thirdQtr[0] = 0;

        //   Get the 4th qtr data
        let qtrObject4 = getQuarter(9, yyyy);
        var firstDate4 = qtrObject4.firstDate;
        var lastDate4 = qtrObject4.lastDate;
        console.log('3rd qtr:' + qtrObject4.qtr);

        console.log('sDate4 :' + firstDate4);
        console.log('eDate4 :' + lastDate4);
        
        const fourthQtr = await Vat.aggregate([
            {
                $match: {'createdAt': {
                    $gte: firstDate4,
                    $lte: lastDate4}, 'sector': sector}
            },
            {
                $group: {
    
                    _id: "$sub_sector",
                    totalSum: { $sum: "$vat"},
                    count: { $sum: 1 }
                }
            }
          ])

          if (!fourthQtr[0]) fourthQtr[0] = 0;
        
        res.status(200).json({message: 'success', firstQuarter: dat, secondQuarter: secondQtr, thirdQuarter: thirdQtr, fourthQuarter: fourthQtr});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

// *****SUB SECTORS END******


// ****** REPORTS STARTS *********

exports.getTopPerfomersByYear = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'topperformers');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var total = +req.params.total;
    var yyyy = +req.params.yyyy;
 
    
    if (!yyyy) {
        const today = new Date();
        yyyy = today.getFullYear();
    }

    var firstDayOfTheYear = new Date(Date.UTC(yyyy, 0, 1, 00, 00, 00));
    var tempDate = new Date(Date.UTC(yyyy, 11, 31, 00, 00, 00));
    var lastDayOfTheYear = new Date(tempDate.getFullYear(), tempDate.getMonth() + 1, 0);
    lastDayOfTheYear.setHours(23,59);

  
    var firstDate = firstDayOfTheYear;
    var lastDate = lastDayOfTheYear;
    // console.log('Sector:' + sector);

    console.log('firstDate:' + firstDayOfTheYear);
    console.log('lastDate: '+ lastDayOfTheYear);
    
      Vat.aggregate([
        
        {
            $match: {'createdAt': {
                $gte: firstDate,
                $lte: lastDate}}
        },
        {
            $group: {

                _id: "$cac_id",
                
                totalVat: { $sum: "$vat"},
                totalTrxn: { $sum: "$transaction_amountgetNumberOfVatsAllTimes"},
                count: { $sum: 1 }
            }
        
        }
      ]
      )
      
        .sort('-totalTrxn')
        .then (async dat => {
            // Get total summation for transaction
            const totalVat = await Vat.aggregate([
                {
                    $match: {'createdAt': {
                        $gte: firstDate,
                        $lte: lastDate}}
                },
                {
                    $group: {
        
                        _id: "$_v",
                        totalVat: { $sum: "$vat"},
                        count: { $sum: 1 }
                    }
                }
            ]);

            console.log('Total Vat:' + totalVat[0].totalVat);
            var cac_id;
            var arrData = [];
            var arrOthers = [];
            var records;
            // Get other records
            for (let i = 0; i < dat.length; i++) {
                cac_id = dat[i]._id;
                console.log('cadID '+ i + ': ' + cac_id);
                
                records = await Company.findOne(
                    {'cac_id': cac_id}, 'company_name sector cac_id'
                );
                // arrOthers.push(records);

                // Get percentage of vat contributed
                 var percentContributed = (dat[i].totalVat * 100)/totalVat[0].totalVat;

                console.log('Records:' + records);
                var newDat =  { "totalVat": dat[i].totalVat ,
                                "totalTrxn" : dat[i].totalTrxn,
                                "count": dat[i].count,
                                "company": records.company_name,
                                "sector": records.sector,
                                "cac_id": records.cac_id,
                                "vatPercentContributed": percentContributed.toFixed(1)
                            }
                        arrData.push(newDat)
            
            }
        
        res.status(200).json({message: 'success', totalVatForAll:totalVat[0].totalVat.toFixed(1), topPerformer: arrData});        
      })  .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })        
       
}

exports.getNumberOfVatsAllTimes = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'numberofvatsalltimes');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

            const count = await Vat.count();

            res.status(200).json({message: 'success', count: count}); 
             
}


exports.getSummaryOfAllTimes = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'summaryofalltimes');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    Vat.aggregate([

        {
            $group: {

                _id: "$_v",   
                totalVat: { $sum: "$vat"},
                totalTrxn: { $sum: "$transaction_amount"},
                count: { $sum: 1 }
            }
        
        }
      ]
      ).then (async dat => {

        const count = await Vat.count();
     

    res.status(200).json({message: 'success', totalTrxnAllTimes: dat[0].totalTrxn, totalVatAllTimes: dat[0].totalVat, totalRecords: count }); 
})  .catch(err => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err); // pass the error to the next error handling function
})        

}


exports.getTransactionsByTrxIdOnly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswithtransactionid');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var trx_id = req.params.trxid;
    
        Vat.find({trx_id: trx_id},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id')
        
        .then(trxs => {

            res.status(200).json({message: 'success', data: trxs});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getTransactionsBySubSectorOnly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswithsubsectoronly');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var sub_sector = req.params.subsector;
    // const today = new Date();
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

        Vat.find({sub_sector: sub_sector},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({sub_sector: sub_sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}


exports.getTransactionsBySectorOnly = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswithsectoronly');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var sector = req.params.sector;
    // const today = new Date();
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

        Vat.find({sector: sector},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({sector: sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}


exports.getTransactionsWith2Dates = (req, res, next) => {
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }
 
    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    // const today = new Date();
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getTransactionsWith2DatesandSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    
    var sector = req.params.sector;
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }, 'sector': sector},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }, 'sector': sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getTransactionsWith2DatesandSubSector = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandsubsector');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    
    var sub_sector = req.params.subsector;
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }, 'sub_sector': sub_sector},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }, 'sub_sector': sub_sector});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}


exports.getTransactionsWith2DatesandRegion = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandregion');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    
    var region = req.params.region;
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }, 'region': region},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }, 'region': region});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getTransactionsWith2DatesandState = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandstate');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    
    var state = req.params.state;
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }, 'state': state},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }, 'state': state});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}


exports.getTransactionsWith2DatesandTIN = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'transactionswith2datesandtin');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    
    var tin = req.params.tin;
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Vat.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }, 'tin': tin},'trx_id tin cac_id transaction_type trade_type company_name company_code transaction_amount base_amount vat, lower_vat sector sub_sector data_submitted taxpro_trans_id earning_type state region createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Vat.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }, 'tin': tin});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}

exports.getVatRecordedByTin = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatrecordedbytin');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    // var dd1 = req.params.dd1;
    var mm = req.params.mm;
    var yyyy = req.params.yyyy;

    if (!mm || !yyyy) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = today.getMonth();
    }
    
    var firstDayOfMonth = new Date(Date.UTC(yyyy, mm, 1, 00, 00, 00));
    var lastDayOfMonth = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0);

    lastDayOfMonth.setHours(23,59);
    var firstDate = firstDayOfMonth;
    var lastDate = lastDayOfMonth;
    
      Vat.aggregate([
        {
            $match: {
                'createdAt': {
                $gte: firstDate,
                $lte: lastDate},
            'tin': '12001705-0001'}
        },
        {
            $group: {

                _id: "$_v",
                totalSum: { $sum: "$vat"},
                count: { $sum: 1 }
            }
        }
      ]
      ).then (dat => {

        let tSum = 0;
        let tCount = 0;
        if (dat.length > 0) {
            tSum = dat[0].totalSum;
            tCount = dat[0].count;
        }
        // const count = await Vat.count();
     

    res.status(200).json({message: 'success', totalAmount: tSum, totalCount: tCount }); 
    })  .catch(err => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err); // pass the error to the next error handling function
})        

}
exports.getAuditTrailWith2Dates = (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'logswith2datesonly');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    var dd1 = req.params.dd1;
    var mm1 = req.params.mm1;
    var yyyy1 = req.params.yyyy1;

    var dd2 = req.params.dd2;
    var mm2 = req.params.mm2;
    var yyyy2 = req.params.yyyy2;
    // const today = new Date();
       
    var page = +req.params.pagenumber;
    var limit = +req.params.limit;
    if (!page || isNaN(page)) page = 1;
    if (!limit || isNaN(limit)) limit = 5;

    var firstDate = new Date(Date.UTC(yyyy1, mm1, dd1, 00, 00, 00));
    var lastDate = new Date(Date.UTC(yyyy2, mm2, dd2, 00, 00, 00));
    firstDate.setHours(01,00);
    lastDate.setHours(23,59);

    
        Tlogs.find({'createdAt': {
            $gte: firstDate, $lte: lastDate }},'email name action createdAt')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort('-createdAt')
        .then(async trxs => {

            const count = await Tlogs.count({'createdAt': {
                $gte: firstDate, $lte: lastDate }});
            
            if(trxs) {
                console.log('Count:' + count);
            }

            var allPages = 0;
            if (count) allPages = Math.ceil(count/limit);

            res.status(200).json({message: 'success', data: trxs, currentPage: page, totalPages: allPages});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
  
}



// *****REPORTS END******

// *******GET DATA FROM TAXPRO******

exports.getMonthlyPayment = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'monthlypayment');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    console.log('finding payment...');
    var total = +req.params.mm;
    const dataIn = JSON.stringify({
        month: +req.params.mm,
        year: +req.params.yyyy,
        integrator_id: 27
      });
    
    console.log('DATA here::' + dataIn);
 
    setTimeout(()=> {
        console.log('Response TaxPro::' + taxProPayLiteral) ; 
        res.status(200).json({message: 'success', monthlyTotal: taxProPayLiteral});      
    }, 2000);
    
    if (bearerToken) {
        try {
    var resp = getDataFromTaxPro(dataIn, bearerToken, '/vat-aggr/payment-summary', 'POST', false);
        }
        catch {
            taxProloginStatus = false;
            console.log('Connection issues with Taxpro');
          }
        } else {
            console.log('Unable to login to TaxPro');
        }

}

exports.getVatPaidByTin = async (req, res, next) => { 
    const access = PM.routesmanager(req.user.userType, 'vatpaidbytin');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }

    console.log('finding payment...');
    var mm = +req.params.mm;
    var tin = req.params.tin;
    var year = +req.params.yyyy;
console.log('MM: ' + mm + ', YYYY: ' + year + ', TIN: ' + tin);
     const dataIn = JSON.stringify({
        tin: tin,
        month: +req.params.mm,
        year: +req.params.yyyy,
        integrator_id: 27
      });
    
    console.log('DATA here::' + dataIn);

    setTimeout(()=> {
        console.log('resp: ' + resp);
        console.log('Response TaxPro1::' + taxProPayLiteral) ;
        res.status(200).json({'message': 'success', 'totalByTIN': taxProPayLiteral});     
    }, 2000);
    
    if (bearerToken) {
    try {
    var resp = getDataFromTaxPro(dataIn, bearerToken, '/vat-aggr/payment-summary', 'POST', false);
    }
    catch {
        taxProloginStatus = false;
        console.log('Connection issues with Taxpro');
      }
    } else {
        console.log('Unable to login to TaxPro');
    }
}