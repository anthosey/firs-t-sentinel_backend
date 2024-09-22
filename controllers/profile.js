const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/company');
const User = require('../models/user');
const Individual = require('../models/personal');
const Transactionz = require('../models/transactionz');
const NegotiatedDeal = require('../models/negotiated_deal');

const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

exports.getCompanies = (req, res, next) => { 
    // console.log('Filter:: ' + tempFilter);
        Company.find()
        .then(coys => {
            res.status(200).json({message: 'success', data: coys});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

exports.getOneCompany = (req, res, next) => {
    const cacId = req.params.cac_id;
    console.log('CAC ID: ' + cacId);

    Company.findOne({cac_id: cacId})
    .then(coys => {
        if (!coys) 
            res.status(202).json({message: 'No record found!'});
        else res.status(200).json(coys);
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

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


exports.addCompany = (req, res, next) => {
    console.log('We GOT hia::');
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed! this error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

 
    const cac_id = req.body.cac_id;
    const company_name = req.body.company_name;
    const company_address = req.body.company_address;
    const tin = req.body.tin;
    const sector = req.body.sector;
    const sub_sector = req.body.sub_sector;
    const company_head = req.body.company_head;
    const email = req.body.email;
    const phone = req.body.phone;
    const mobile = req.body.mobile;
    const image_url = req.body.image_url;
    const incorporation_date = req.body.incorporation_date;
    const established_date = req.body.established_date;
    const brief_history = req.body.brief_history;
    const extra_note = req.body.extra_note;
    // New fields (firs_id was replaced with tin)
    const company_code = req.body.company_code;
    const postal_address = req.body.postal_address;
    const corporate_website = req.body.corporate_website;
    const taxpayer_name = req.body.taxpayer_name;
    const taxpayer_address = req.body.taxpayer_address;
    const tax_office_id = req.body.tax_office_id;
    const tax_office_address = req.body.tax_office_address;
    const operating_licence_type = req.body.operating_licence_type;
    const proprietary_account = req.body.proprietary_account;

            const company = new Company({
                cac_id: cac_id,
                company_name: company_name,
                company_address: company_address,
                tin: tin,
                sector: sector,
                sub_sector: sub_sector,
                company_head: company_head,
                phone: phone,
                mobile: mobile,
                email: email,
                image_url: image_url,
                incorporation_date: incorporation_date,
                established_date: established_date,
                brief_history: brief_history,
                extra_note: extra_note,
                company_code: company_code,
                postal_address: postal_address,
                corporate_website: corporate_website,
                taxpayer_name: taxpayer_name,
                taxpayer_address: taxpayer_address,
                tax_office_id: tax_office_id,
                tax_office_address: tax_office_address,
                operating_licence_type: operating_licence_type,
                proprietary_account: proprietary_account
                
            });
            
            company.save()
            
            .then (record =>{

                // Create login for the company
                const token = generateToken(6);
                const firstname = company_name.split(' ')[0];
                const lastname = company_name.split(' ')[1];
                // const email = req.body.email;
                // const mobile = req.body.mobile;
                const password = 'Password123';
                const usertype = 'company';
                const status = 'verified';
                // const rating = 5;

                var hashedPasskeys;

                // Create secure hash password with bcrypt

                bcrypt.hash(password, 12)
                .then(hashPassword => {
                    hashedPasskeys = hashPassword;
                    bcrypt.hash(token, 12)
                    .then (async hashedToken => {

                const user = new User({
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    mobile: mobile,
                    password: hashedPasskeys,
                    usertype: usertype,
                    status: status,
                    // wallet: wallet,
                    accountActivationToken: hashedToken
                
                });
                await user.save();
                
            });
        });
        
       
                // Create a signup profile for the company




                console.log('record::' + record);
                tinVerificationData.push(company); //send data to the central waiting pool
                res.status(201).json({
                    message: 'account created successfully',
                    data: {cac_id: cac_id,
                        company_name: company_name,
                        company_address: company_address,
                        tin: tin,
                        sector: sector,
                        sub_sector: sub_sector,
                        company_head: company_head,
                        phone: phone,
                        email: email,
                        mobile: mobile,
                        image_url: image_url,
                        incorporation_date: incorporation_date,
                        established_date: established_date,
                        brief_history: brief_history,
                        extra_note: extra_note,
                        company_code: company_code,
                        postal_address: postal_address,
                        corporate_website: corporate_website,
                        tin_verified: 0
                               
                    }
                })
               
            })
            
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
}



// Add Company with image upload

exports.addCompanyWithImagefile = (req, res, next) => {
    console.log('We GOT hia::');
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        console.log(errors);
        const error = new Error('Validation failed! this error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

 
    const cac_id = req.body.cac_id;
    const company_name = req.body.company_name;
    const company_address = req.body.company_address;
    const tin = req.body.tin;
    const sector = req.body.sector;
    const sub_sector = req.body.sub_sector;
    const company_head = req.body.company_head;
    const email = req.body.email;
    const phone = req.body.phone;
    const mobile = req.body.mobile;
    const image_url = req.body.image_url;
    const incorporation_date = req.body.incorporation_date;
    const established_date = req.body.established_date;
    const brief_history = req.body.brief_history;
    const extra_note = req.body.extra_note;
    // New fields (firs_id was replaced with tin)
    const company_code = req.body.company_code;
    const postal_address = req.body.postal_address;
    const corporate_website = req.body.corporate_website;
    const taxpayer_name = req.body.taxpayer_name;
    const taxpayer_address = req.body.taxpayer_address;
    const tax_office_id = req.body.tax_office_id;
    const tax_office_address = req.body.tax_office_address;
    const operating_licence_type = req.body.operating_licence_type;
    const proprietary_account = req.body.proprietary_account;

     // Validate picture
     if (!req.file) {
        const error = new Error('No image provided too 4.');
        error.statusCode = 422;
        throw error;
    }

    const imageUrl = req.file.path;

    // End picture validation


    const company = new Company({
                cac_id: cac_id,
                company_name: company_name,
                company_address: company_address,
                tin: tin,
                sector: sector,
                sub_sector: sub_sector,
                company_head: company_head,
                phone: phone,
                mobile: mobile,
                email: email,
                image_url: imageUrl,
                incorporation_date: incorporation_date,
                established_date: established_date,
                brief_history: brief_history,
                extra_note: extra_note,
                company_code: company_code,
                postal_address: postal_address,
                corporate_website: corporate_website,
                taxpayer_name: taxpayer_name,
                taxpayer_address: taxpayer_address,
                tax_office_id: tax_office_id,
                tax_office_address: tax_office_address,
                operating_licence_type: operating_licence_type,
                proprietary_account: proprietary_account
                
            });
            
            company.save()
            
            .then (record =>{

                // Create login for the company
                const token = generateToken(6);
                const firstname = company_name.split(' ')[0];
                const lastname = company_name.split(' ')[1];
                // const email = req.body.email;
                // const mobile = req.body.mobile;
                const password = 'Password123';
                const usertype = 'company';
                const status = 'verified';
                // const rating = 5;

                var hashedPasskeys;

                // Create secure hash password with bcrypt

                bcrypt.hash(password, 12)
                .then(hashPassword => {
                    hashedPasskeys = hashPassword;
                    bcrypt.hash(token, 12)
                    .then (async hashedToken => {

                const user = new User({
                    firstname: firstname,
                    lastname: lastname,
                    email: email,
                    mobile: mobile,
                    password: hashedPasskeys,
                    usertype: usertype,
                    status: status,
                    // wallet: wallet,
                    accountActivationToken: hashedToken
                
                });
                await user.save();
                
            });
        });
               
                // Create a signup profile for the company

                console.log('record::' + record);
                tinVerificationData.push(company); //send data to the central waiting pool
                res.status(201).json({
                    message: 'account created successfully',
                    data: {cac_id: cac_id,
                        company_name: company_name,
                        company_address: company_address,
                        tin: tin,
                        sector: sector,
                        sub_sector: sub_sector,
                        company_head: company_head,
                        phone: phone,
                        email: email,
                        mobile: mobile,
                        image_url: imageUrl,
                        incorporation_date: incorporation_date,
                        established_date: established_date,
                        brief_history: brief_history,
                        extra_note: extra_note,
                        company_code: company_code,
                        postal_address: postal_address,
                        corporate_website: corporate_website,
                        tin_verified: 0
                               
                    }
                })
               
            })
            
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
}

exports.addNegotiatedDeal = (req, res, next) => {
    console.log('We GOT hia::');
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed! this error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const company_code = req.body.company_code;
    const company_name = req.body.company_name;    
    const customer_account_no = req.body.customer_account_no;
    const negotiated_rate = req.body.negotiated_rate;

    
    NegotiatedDeal.findOne({company_code: company_code, customer_account_no: customer_account_no})
    .then(acctFound =>{
       if(!acctFound) {

        const negotiatedDeal = new NegotiatedDeal({
                
            company_code: company_code,
            company_name: company_name,
            customer_account_no: customer_account_no,
            negotiated_rate: negotiated_rate
        });
        
        negotiatedDeal.save()
        .then(data => {
            res.status(201).json({message: 'Data submitted successfully'});
        })
       } else {
        res.status(202).json({message: 'Negotiated rate for this customer already exists in your profile'});
       }    
               
})
}
 
function getDateValidated(dd, mm, yy) {
    var now = new Date();
    const dayOfMonth = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    var resp = 'Not good';
    console.log('Now: ' + dayOfMonth + '/' + month + '/' + year);
    console.log('tR_Date : ' + dd + '/' + mm + '/' + yy);
    if (dd >= dayOfMonth && mm >= month && yy >= year) {
        console.log('All conditions are met.')
        resp = 'All good';
    } else {
        console.log('One or more conditions are NOT met.');
        resp = 'Not good';
    } 
    // resp  = resp + 'Now: ' + dayOfMonth + '/' + month + '/' + year;
    return resp;
}

exports.addNegotiatedDealBroad = async (req, res, next) => {
    console.log('We GOT hia::');
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed! this error');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    const company_code = req.body.company_code;
    const company_name = req.body.company_name;    
    const customer_account_no = req.body.customer_account_no;
    const negotiated_rate = req.body.negotiated_rate;
    const trDay = req.body.trday;
    const trMonth = req.body.trmonth;
    const trYear = req.body.tryear;
    const stock_symbol = req.body.stock_symbol;
    var dealType = req.body.deal_type;
    
    dealType = dealType.toUpperCase();
    console.log('DEAL Type::' + dealType);



    if (!company_code) { res.status(202).json({message: 'Please Provide the Comapany Code'});
        return;
    }

    
    if (!company_name) { res.status(202).json({message: 'Please Provide the Comapany Name'});
        return;
    }

    if (!dealType) { res.status(202).json({message: 'Please select a deal type'});
    return;
    }

    if (!negotiated_rate) { res.status(202).json({message: 'Please provide a rate for this deal'});
    return;
    }
    

    // Check The type of Deal
    if (dealType == 'ACCOUNT BOUND' || dealType == 'ACCOUNT_BOUND') {
       if (!customer_account_no) {console.log('Please Provide Customer Account Number')
        res.status(202).json({message: 'Please Provide Customer Account Number'});
        return;
       }
    } else if (dealType == 'STOCK BOUND' || dealType == 'STOCK_BOUND')  {

        if (!stock_symbol) {console.log('Please Provide the Stock Symbol for this deal')
            res.status(202).json({message: 'Please Provide the Stock Symbol for this deal'});
            return;
           } 

        if (!customer_account_no) {console.log('Please Provide the beneficiary account for this deal')
            res.status(202).json({message: 'Please Provide the beneficiary account for this deal'});
            return;
           } 
           
        if (!trDay || !trMonth || !trYear) {
            res.status(202).json({message: 'Please Provide a date to execute this deal'});
            return;
        } else {
            const resp = getDateValidated(trDay, trMonth, trYear);
            if (resp == 'Not good') {
                res.status(202).json({message: 'Invalid Date'});
                return;
            }
    
        }

    }

//     // Check duplicate for account-bound deals
//     NegotiatedDeal.findOne({company_code: company_code, customer_account_no: customer_account_no, deal_type: 'ACCOUNT-BOUND'})
//     .then(acctFound =>{
//        if(acctFound) {
//         res.status(202).json({message: 'Negotiated rate for this customer already exists as account based in your profile'});
//         return;

        
//        } else {
//         // Check Duplicate of Stock-Bound
//         NegotiatedDeal.findOne({company_code: company_code, deal_type: 'STOCK BOUND', customer_account_no: customer_account_no, stock_symbol: stock_symbol})
//         .then (stockFound =>{
//              if (stockFound) {
//                 res.status(202).json({message: 'Negotiated rate on ' +  stock_symbol + ' has been set for this customer'});
//             return
//        } else{ // Check duplicate for company based
//         NegotiatedDeal.findOne({company_code: company_code, deal_type: 'COMPANY BOUND'})
//         .then (companyFound => {
//             if (companyFound){
//             res.status(202).json({message: 'General commission rate for this company has been set already.'});
//             return;
//             }
//         })
//        }
//     })

//       // Submit new Data
//       const negotiatedDeal = new NegotiatedDeal({
                
//         company_code: company_code,
//         company_name: company_name,
//         customer_account_no: customer_account_no,
//         negotiated_rate: negotiated_rate,
//         trade_day: trDay,
//         trade_month: trMonth,
//         trade_year: trYear,
//         stock_symbol: stock_symbol,
//         deal_type: dealType,
//         active: 1
//     });
    
//     negotiatedDeal.save()
//     .then(data => {
//         res.status(201).json({message: 'Data submitted successfully'});
//     })
                
// } 
//     })
try {
    if (dealType == 'ACCOUNT BOUND' || dealType == 'ACCOUNT_BOUND') {
        console.log('Deal Typ2::' + dealType);
    // Check for account-bound deal
    let acctFound = await NegotiatedDeal.findOne({
        company_code: company_code,
        customer_account_no: customer_account_no,
        deal_type: 'ACCOUNT_BOUND'
      });
  
      if (acctFound) {
        return res.status(202).json({
          message: 'Negotiated rate for this customer already exists as account based in your profile'
        });
      }
    } 
    
    if (dealType == 'STOCK BOUND' || dealType == 'STOCK_BOUND') {

        console.log('Deal Typ2::' + dealType);
    // Check for stock-bound deal
      let stockFound = await NegotiatedDeal.findOne({
        company_code: company_code,
        deal_type: 'STOCK_BOUND',
        customer_account_no: customer_account_no,
        stock_symbol: stock_symbol,
        trade_day: trDay,
        trade_month: trMonth,
        trade_year: trYear
      });
  
      if (stockFound) {
        return res.status(202).json({
          message: 'Negotiated rate on ' + stock_symbol + ' has been set for this customer'
        });
      }
    } 
    
    if (dealType == 'COMPANY BOUND' || dealType == 'COMPANY_BOUND') {
        console.log('Deal Typ2::' + dealType);
    // Check for company-bound deal
      let companyFound = await NegotiatedDeal.findOne({
        company_code: company_code,
        deal_type: 'COMPANY_BOUND'
      });
  
      if (companyFound) {
        return res.status(202).json({
          message: 'General commission rate for this company has been set already.'
        });
      }
    } 

      // Submit new data
      const negotiatedDeal = new NegotiatedDeal({
        company_code: company_code,
        company_name: company_name,
        customer_account_no: customer_account_no,
        negotiated_rate: negotiated_rate,
        trade_day: trDay,
        trade_month: trMonth,
        trade_year: trYear,
        stock_symbol: stock_symbol,
        deal_type: dealType,
        active: 1
      });
  
      await negotiatedDeal.save();
  
      return res.status(201).json({
        message: 'Data submitted successfully'
      });
      
    // console.log('Data Processed!..');
  
    } catch (error) {
      // Handle any errors that occurred during database operations
      console.error(error);
      return res.status(500).json({
        message: 'An error occurred while processing your request'
      });
    }
}

exports.getNegotiatedDealsByOwner = (req, res, next) => {
    const coyCode = req.params.company_code;
    // console.log('U ID::' + userId);
    NegotiatedDeal.find({company_code: coyCode, active: 1}, 'company_code company_name customer_account_no negotiated_rate trade_day trade_month trade_year stock_symbol deal_type')
    .then(trxs => {
        if (trxs) {
            res.status(200).json({'message': 'Success', 'data': trxs });
        } else {
            res.status(200).json({'message':'No data found' });
        }
      
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.updateCompany = (req, res, next) => {
    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    // token = generateToken(6);
    const cac_id = req.body.cac_id;
    const company_name = req.body.company_name;
    const company_address = req.body.company_address;
    const tin = req.body.tin;
    const sector = req.body.sector;
    const company_head = req.body.company_head;
    const email = req.body.email;
    const phone = req.body.phone;
    const mobile = req.body.mobile;
    const image_url = req.body.image_url;
    const incorporation_date = req.body.incorporation_date;
    const established_date = req.body.established_date;
    const brief_history = req.body.brief_history;
    const extra_note = req.body.extra_note;

    const company_code = req.body.company_code;
    const postal_address = req.body.postal_address;
    const corporate_website = req.body.corporate_website;

    
    Company.findOne({cac_id: cac_id})
    .then(coyFound =>{
        coyFound.cac_id = cac_id;
        coyFound.company_name = company_name;
        coyFound.company_address = company_address;
        coyFound.tin = tin;
        coyFound.sector = sector;
        coyFound.company_head = company_head;
        coyFound.email = email;
        coyFound.phone = phone;
        coyFound.mobile = mobile;
        coyFound.image_url= image_url;
        coyFound.incorporation_date = incorporation_date;
        coyFound.established_date = established_date;
        coyFound.brief_history = brief_history;
        coyFound.extra_note = extra_note;

        coyFound.company_code = company_code;
        coyFound.postal_address = postal_address;
        coyFound.corporate_website = corporate_website;



        return coyFound.save();
    })
    .then(coy => {
        res.status(201).json({message: 'Company updated successfully', data: coy});

    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });

}



exports.updateTinVerification = (req, res, next) => {
    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    // token = generateToken(6);
    const cac_id = req.body.cac_id;
    const tin = req.body.tin;
    const taxpayer_name = req.body.taxtpayer_name;
    const taxpayer_address = req.body.taxpayer_address;
    const tax_office_id = req.body.tax_office_id;
    const tax_office_address = req.body.tax_office_address;
    const tin_verification = "Verified"
    
    
    Company.findOne({cac_id: cac_id})
    .then(coyFound =>{
        // coyFound.cac_id = cac_id;
        coyFound.tin = tin;
        coyFound.taxpayer_name = taxpayer_name;
        coyFound.txpayer_address = taxpayer_address;
        coyFound.tax_office_id = tax_office_id;
        coyFound.tax_office_address = tax_office_address;
        coyFound.tin_verification = tin_verification;
        
        return coyFound.save();
    })
    .then(coy => {
        res.status(201).json({message: 'details saved successfully', data: coy});

    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });

}

exports.deleteCompany = (req, res, next) => {

    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    const cac_id = req.body.cac_id;
    console.log('CAC ID: ' + cac_id);
    Transactionz.findOne({cac_id: cac_id})
        .then (data => {
                if (data) {
                    // Send a response and avoid a delete
                    res.status(401).json({message: 'Some transactions are linked to this company and cannot be deleted, use force delete!'});
                } else {
                    // Delete
                    Company.findOneAndDelete({cac_id: cac_id})
        .then(coys => {
        res.status(200).json({message: 'Company deleted successfully!'});
        })
    
        }
        
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.deleteDeal = (req, res, next) => {
console.log('YEs Deal!!');
    const errors = validationResult(req);
    var msg;
    var token;
    // if (!errors.isEmpty()) {
    //     const error = new Error('Validation failed!');
    //     error.statusCode = 422;
    //     error.data = errors.array();
    //     throw error;
    // }
    
    const id = req.body.id;
    console.log('ID received:' + id) ;
    // const doc = await NegotiatedDeal.findById(ObjectId(id));
    // const customer_account = req.body.customer_account_no;
    
    // NegotiatedDeal.findOneAndDelete({customer_account_no: customer_account})
    NegotiatedDeal.findByIdAndDelete(ObjectId(id))
        .then(found => {
        res.status(200).json({message: 'Deal deleted successfully!'});
        
        // Document action

        })
        
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}




exports.deleteCompanyWithTransactions = (req, res, next) => {

    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    const cac_id = req.body.cac_id;
    console.log('CAC ID: ' + cac_id);

    Company.findOneAndDelete({cac_id: cac_id})
    .then(coys => {

        Transactionz.deleteMany({cac_id: cac_id})
        .then (data => {

            console.log('Deleted: ' + JSON.stringify(coys));
        res.status(200).json({message: 'Company deleted successfully!'});
        })
    
        
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}
// INDIVIDUAL STARTS HERE

exports.addIndividual = (req, res, next) => {
    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }

    
 
    // const cac_id = req.body.cac_id;
    const user_id = req.body.email;
    const name = req.body.name;
    const mobile = req.body.mobile;
    const email = req.body.email;
    const company = req.body.company;
    const position = req.body.position;
    const office_Address = req.body.office_address;
    const brief_history = req.body.brief_history;
    const extra_note = req.body.extra_note;
    // const image_url = req.body.image_url;
    // const incorporation_date = req.body.incorporation_date;
    // const established_date = req.body.established_date;
    // const brief_history = req.body.brief_history;
    // const extra_note = req.body.extra_note;
    
    
            const individual = new Individual({
                user_id: user_id,
                name: name,
                mobile: mobile,
                email: email,
                company: company,
                position: position,
                office_address: office_Address,
                brief_history: brief_history,
                extra_note: extra_note
                
            });
            
            individual.save()
            
            .then (record =>{
                console.log('record::' + record);
                res.status(201).json({
                    message: 'account created successfully',
                    data: {name: name,
                        mobile: mobile,
                        email: email,
                        company: company,
                        position: position,
                        office_address: office_Address,
                        brief_history: brief_history,
                        extra_note: extra_note     }
                })
        
            })
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
}


exports.updateIndividual = (req, res, next) => {
    
    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    // token = generateToken(6);
    const user_id = req.body.email;
    const name = req.body.name;
    const mobile = req.body.mobile;
    const email = req.body.email;
    const company = req.body.company;
    const position = req.body.position;
    const office_Address = req.body.office_address;
    const brief_history = req.body.brief_history;
    const extra_note = req.body.extra_note;
    
    Individual.findOne({user_id: user_id})
    .then(userFound =>{
        if (!userFound) res.status(202).json({message: 'Data ID not found!'});
        
        userFound.user_id = user_id,
        userFound.name = name,
        userFound.mobile = mobile,
        // userFound.email = email,
        userFound.company = company,
        userFound.position = position,
        userFound.office_address = office_Address,
        userFound.brief_history = brief_history,
        userFound.extra_note = extra_note

        return userFound.save();
    })
    .then(usr => {
        res.status(201).json({message: 'Individual data updated successfully', data: usr});

    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });

}

exports.deleteIndividual = (req, res, next) => {

    const errors = validationResult(req);
    var msg;
    var token;
    if (!errors.isEmpty()) {
        const error = new Error('Validation failed!');
        error.statusCode = 422;
        error.data = errors.array();
        throw error;
    }


    const email = req.body.email;
    console.log('email: ' + email);

    Individual.findOneAndDelete({user_id: email})
    .then(pers => {
    
        console.log('Deleted: ' + JSON.stringify(pers));
        res.status(200).json({message: 'Individual record deleted successfully!'});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}

exports.getIndividuals = (req, res, next) => { 
    // console.log('Filter:: ' + tempFilter);
        Individual.find()
        .then(usrs => {
            res.status(200).json({message: 'success', data: usrs});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}

exports.getOneIndividual = (req, res, next) => {
    const email = req.params.email;
    console.log('Email: ' + email);

    Individual.findOne({email: email})
    .then(usrs => {
        if (!usrs) 
            res.status(202).json({message: 'No record found!'});
        else res.status(200).json(usrs);
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}
