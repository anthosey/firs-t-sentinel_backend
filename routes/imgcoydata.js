const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/user')
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const valDuplicate = require('../middleware/dupValidate');

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

module.exports = (upload) => {
    // Create the upload endpoint
    router.post('/updatecompany', upload.single('image_url'), (req, res, next) => {

    
    // const errors = validationResult(req);
    // var msg;
    // var token;
    // if (!errors.isEmpty()) {
    //     const error = new Error('Validation failed!');
    //     error.statusCode = 422;
    //     error.data = errors.array();
    //     throw error;
    // }

    var imageUrl = null
     // Validate picture
     if (req.file) {
        imageUrl = req.file.location;    
    }

    
    // End picture validation
    console.log('img url:: ' +  imageUrl)


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
        if(imageUrl) {
            coyFound.image_url= imageUrl;
        }
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
        console.log('The Error:: ' + err);
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    });

})

router.post('/addcompany', upload.single('image_url'), (req, res, next) => {

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
    // const image_url = req.body.image_url;
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

    
    const imageUrl = req.file.location;

    // End picture validation
console.log('img url:: ' +  imageUrl)

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
                    err.statusCode = 408;
                }
                // next(err); // pass the error to the next error handling function
                return res.status(408).json({"error": "Dulicate errors"  });
            });
       
    });

return router;
}
