const express = require('express');
const router = express.Router();
const Company = require('../models/company');
const User = require('../models/user')
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const csv = require('csv-parser');
const fs = require('fs');
const NegotiatedDeal = require('../models/negotiated_deal');

const axios = require('axios');
const { Readable } = require('stream');
const path = require('path');

const valDuplicate = require('../middleware/dupValidate');
const company = require('../models/company');
const isAuth = require('../middleware/isAuth');
const PM = require('../middleware/privilegemanager');
const nodemailer = require('nodemailer');

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


function getDateValidated(dd, mm, yy) {
    var now = new Date();
    const dayOfMonth = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    var resp = 'Not good';
   
    if (dd >= dayOfMonth && mm >= month && yy >= year) {
        if (mm > 12 || mm < 1) {
            resp = 'Not good';
        } 
        else if (dd > 31 || dd < 1) {
            resp = 'Not good';
        }

        else if (dd > 29 && mm == 2) {
                resp = 'Not good';
        } else resp = 'All good';
    } else {
        resp = 'Not good';
    } 

    return resp;
}

function validateDealType(dealType) {
if (dealType == 'COMPANY BOUND' || dealType == 'COMPANY_BOUND' || dealType == 'ACCOUNT BOUND' || dealType == 'ACCOUNT_BOUND' || dealType == 'STOCK BOUND' || dealType == "STOCK_BOUND") {
 return 'valid'
} else return 'invalid'
}

function validateNumber(num) {
        return !isNaN(Number(num));  
}
async function processCsvDataForSubmission(dat, company_code){
    const data = dat;
    
    for (let i = 0; i < data.length; i++) {
     
     
        let dealType = data[i].deal_type;
        let negotiated_rate = data[i].negotiated_rate;
        let customer_account_no = data[i].customer_account_no;
        let stock_symbol = data[i].stock_symbol;
        let trDay = data[i].trade_day;
        let trMonth = data[i].trade_month;
        let trYear = data[i].trade_year;
      

        

        console.log('day:' + trDay + ', Month:' + trMonth + ', Year:' + trYear);
        
        if (!dealType) { 
            return {title: "Error", message: 'Please select a deal type'};
        }

        try {
            dealType = dealType.toUpperCase();
        } catch(error) {
            // could not perform operation
        }

        let dealValid = validateDealType(dealType);
        if (dealValid == 'invalid') {return {title: "Error", message: 'Please provide a valid deal type: (COMPANY BOUND, ACCOUNT BOUND or STOCK BOUND)'}; }

        if (!negotiated_rate) { 
            return {title: "Error", message: 'Please provide a rate for this deal'};
        }

        let valid = validateNumber(negotiated_rate);
        if (!valid) return {title: "Error", message: 'Please provide rates in figures'};

        // Check The type of Deal
        if (dealType == 'ACCOUNT BOUND' || dealType == 'ACCOUNT_BOUND') {
            if (!customer_account_no) {
                return {title: "Error", message: 'Please Provide Customer Account Number'};
            }
        } else if (dealType == 'STOCK BOUND' || dealType == 'STOCK_BOUND')  {
        
            if (!stock_symbol) {console.log('Please Provide the Stock Symbol for this deal')
                // res.status(202).json({message: 'Please Provide the Stock Symbol for this deal'});
                return {title: "Error", message: 'Please Provide the Stock Symbol for this deal'};
                
                } 
        
            if (!customer_account_no) {console.log('Please Provide the beneficiary account for this deal')
                return {title: "Error", message: 'Please Provide the beneficiary account for this deal'};
                // res.status(202).json({message: 'Please Provide the beneficiary account for this deal'});
                // return;
                } 
                
            if (!trDay || !trMonth || !trYear) {
                return {title: "Error", message: 'Please Provide a date :day, month, and year to execute this deal'};
                // res.status(202).json({message: 'Please Provide a date to execute this deal'});
                // return;
            } else {
                    let validDay = validateNumber(trDay);
                    let validMonth = validateNumber(trMonth);
                    let validYear = validateNumber(trYear);
                    if (!validDay || !validMonth || !validYear) return {title: "Error", message: 'Please provide dates in numbers: e.g: trade_day=29, trade_month=9, trade_year=2024'};

                    const resp = getDateValidated(trDay, trMonth, trYear);
                    if (resp == 'Not good') {
                        return {title: "Error", message: 'Invalid Date'};
                    // res.status(202).json({message: 'Invalid Date'});
                    // return;
                }
        
            }
        
        }
        
        
        
        if (dealType == 'ACCOUNT BOUND' || dealType == 'ACCOUNT_BOUND') {
            // console.log('Deal Typ2::' + dealType);
        // Check for account-bound deal
        let acctFound = await NegotiatedDeal.findOne({
            company_code: company_code,
            customer_account_no: customer_account_no,
            deal_type: 'ACCOUNT_BOUND'
        });
        
        if (acctFound) {
            return {title: "Error", message: 'Negotiated rate for this customer: ' + customer_account_no + ' already exists as account bound in your profile'};
            // return res.status(202).json({
            // message: 'Negotiated rate for this customer already exists as account based in your profile'
            // });
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
            return {title: "Error", message: 'Negotiated rate on ' + stock_symbol + ' has been set for this customer: ' + customer_account_no};
            // return res.status(202).json({
            // message: 'Negotiated rate on ' + stock_symbol + ' has been set for this customer'
            // });
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
            return {title: "Error", message: 'General commission rate for this company has been set already.'};
            // return res.status(202).json({
            // message: 'General commission rate for this company has been set already.'
            // });
        }
        } 
    }

    return {title: "Success", message: 'All good.'};
}

module.exports = (upload) => {
    // Create the upload endpoint
router.post('/updatecompany', upload.single('image_url'), (req, res, next) => {

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


router.post('/uploaddealbycsv', isAuth, upload.single('csv_file'), (req, res, next) => {
    console.log('LOGGED IN USER::' + req.userId);
    console.log('USER ITSELF:: ' + JSON.stringify(req.user, null, 2));
    console.log('USER ITSELF:: ' + req.user.userType);

    const access = PM.routesmanager(req.user.userType, 'uploaddealbycsv');
    if (access == 'Disallow') {
        return res.status(401).json({message: 'Insufficient Privilege'});  
    }
 
    const company_name = req.body.company_name;
    const company_code = req.body.company_code;
    var j = 0;
    var csvUrl = null
     // Validate file

     if (!req.file) {
        const error = new Error('No file provided.');
        error.statusCode = 422;
        throw error;
    }

     if (req.file) {
        csvUrl = req.file.location;    
    }
  
        // Create an empty array to hold the CSV data
        const results = [];

        // Fetch the CSV file and process it
        axios.get(csvUrl, { responseType: 'stream' })
        .then((response) => {
            // Pipe the data from the response stream into csv-parser
            response.data
            .pipe(csv())
            .on('data', (data) => results.push(data))  // Push each row into the results array
            .on('end', async () => {
                
                // console.log(results);

                // Process the data according to the rules
                let resp = await processCsvDataForSubmission(results, company_code)
                console.log('RESP::' + resp);
                console.log('Title::' + resp.title + ', msg:' + resp.message);

                if (resp.title == "Success"){
                   
                    j = 0;
                    for (let i = 0; i < results.length; i++){
                        // Submit new data
                        let stockSymbol = results[i].stock_symbol.toUpperCase();
                        let dealType = results[i].deal_type.toUpperCase();
                        if (dealType == "COMPANY BOUND") dealType = "COMPANY_BOUND";
                        if (dealType == "ACCOUNT BOUND") dealType = "ACCOUNT_BOUND";
                        if (dealType == "STOCK BOUND") dealType = "STOCK_BOUND";

                        console.log('B4::day:' + results[i].trade_day + ', Month:' + results[i].trade_month + ', Year:' + results[i].trade_year);

                        const negotiatedDeal = new NegotiatedDeal({
                            company_code: company_code,
                            company_name: company_name,
                            customer_account_no: results[i].customer_account_no,
                            negotiated_rate: results[i].negotiated_rate,
                            trade_day: results[i].trade_day,
                            trade_month: results[i].trade_month,
                            trade_year: results[i].trade_year,
                            stock_symbol: stockSymbol,
                            deal_type: dealType,
                            active: 1
                        });
                    
                        await negotiatedDeal.save();
                        j = j + 1;
                    
                    }

                    return res.status(201).json({message: 'Csv file processed successfully. Data count: ' + j});
                } else {
                    // 
                    return res.status(202).json({message: resp.message});  
                }
            });
        })
        .catch((error) => {
        console.error('Error fetching the CSV file:', error);
        return res.status(501).json({message: "Processing error from the server"});
    });
    
});

function sendmail(name, sendTo, Subject){
console.log('Name from email:' + name + ', Email sendTo:' + sendTo + ', subject: ' + Subject );
const emailBody = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>TSENTINEL Welcome Email</title>
  </head>
  <style>
    #butsection a{
       background-color: #d9ead3;
            color: #000000;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 15px;
            border: 1px solid #b6d7a8;
    }

    #butsection a:hover{
      color: red;
      
    }
  </style>
  <body
    style="
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: Arial, sans-serif;
      text-align: justify;
    "
  >
    <!-- Top Banner -->
    <div style="background-color: #d9ead3; padding: 100px 10px 0 10px">
      <div
        style="
          max-width: 520px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 32px 24px 0 24px;
          border-radius: 12px 12px 0 0;
        "
      >
        <!-- Header -->
        <h1
          style="
            text-align: center;
            color: #0b2545;
            font-size: 26px;
            font-weight: bold;
            margin: 0 0 8px;
          "
        >
          WELCOME!
        </h1>
        <p
          style="
            text-align: center;
            color: #444;
            font-size: 15px;
            margin: 0 0 12px;
          "
        >
          ${name}!
        </p>

        <!-- Underline to mark end of green background -->
        <hr
          style="
            border: none;
            height: 1px;
            background-color: #cccccc;
            margin: 0;
          "
        />
      </div>
    </div>

    <!-- Main Content Card -->
    <div
      style="
        max-width: 520px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      "
    >
      <!-- Welcome Paragraphs -->
      <p
        style="
          font-size: 15px;
          color: #000000;
          line-height: 1.7;
          margin: 24px 0 16px;
        "
      >
        <strong
          >We are delighted to have you onboarded to the FIRS-TSENTINEL Platform
          😊.</strong
        >
      </p>

      <p
        style="
          font-size: 15px;
          color: #000000;
          line-height: 1.7;
          margin-bottom: 16px;
        "
      >
        This platform helps automate the computations of the VAT components of
        your trading activities that happens on the platform of the Nigerian
        Exchange Group (NGX), making data visibility a possibility in the
        capital market.
      </p>

      <p
        style="
          font-size: 15px;
          color: #000000;
          line-height: 1.7;
          margin-bottom: 16px;
        "
      >
        Use the below details to access the platform and create your rate
        settings as may be applicable to your dealings with your various
        clients.
      </p>

      <!-- Credentials Block -->
      <div
        style="
          background-color: #f4f4f4;
          padding: 16px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          margin-bottom: 32px;
        "
      >
        <div>
          <strong>Username:</strong>
          <a href="mailto:seye@photizotechnologies.com" style="color: #0b57d0"
            >${sendTo}</a
          >
        </div>
        <div><strong>Password:</strong> Password123</div>
      </div>

      <!-- Instructions -->
      <p
        style="
          font-size: 16px;
          font-weight: bold;
          color: #000000;
          margin: 0 0 12px;
        "
      >
        In order to complete onboarding setup, do the following;
      </p>

      <ul
        style="
          font-size: 15px;
          color: #666666;
          padding-left: 20px;
          line-height: 1.7;
          margin: 0 0 24px;
        "
      >
        <li style="margin-bottom: 10px">
          <a
            href="https://tsentineltech.com"
            style="color: #444444; text-decoration: underline; font-weight: 600"
          >
            Login
          </a>
          <span style="color: #444444; text-decoration: none; font-weight: 600"
            >to your Dashboard</span
          >
          using the credentials above.
        </li>
        <li>
          <span style="color: #444444; text-decoration: none; font-weight: 600">
            Change your password
          </span>
          — this can be found at the top-right corner of your Dashboard.
        </li>
      </ul>

      <!-- Highlight CTA Block -->
      <div
        style="
          background-color: #f2f2f2;
          padding: 16px 20px;
          border-radius: 15px;
          margin: 24px 0;
        "
      >
        <p style="margin: 0; font-size: 15px; line-height: 1.6; color: #333">
          Alternatively, click on the button below to get started or click
          <a
            href="https://tsentineltech.com/guide" target="blank"
            style="color: #444444; font-weight: 600; text-decoration: underline"
          >
            here
          </a>
          to learn more.
        </p>
      </div>

      <!-- CTA Button -->
      <div id="butsection" style="text-align: center; margin-bottom: 32px">
        <a href="htts://tsentineltech.com" target="blank">
          Get Started
        </a>
      </div>

      <!-- Footer -->
      <p style="font-size: 15px; color: #000000; margin: 0 0 8px">
        Kind Regards,
      </p>
      <p
        style="
          font-size: 15px;
          font-weight: bold;
          color: #000000;
          margin: 0 0 4px;
        "
      >
        The T-Sentinel Team
      </p>
      <p style="font-size: 14px; color: #333333; margin: 0 0 24px">
        For: Federal Inland Revenue Service (FIRS)
      </p>

      <!-- Disclaimer -->
      <p
        style="
          margin-top: 24px;
          text-align: center;
          font-size: 14px;
          color: #7baac9;
          line-height: 1.6;
        "
      >
        You received this email because you just signed up for a new account.<br />
        If you did not signup for a new account, please ignore.
      </p>
    </div>
  </body>
</html>
`;

const transporter = nodemailer.createTransport({ 
  host: 'smtp.stackmail.com',
  port: 465,
  secure: true, // true for port 465
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_PASS,
  },
});


const mailOptions = {
  from: process.env.EMAIL_ACCOUNT,
  to: sendTo,
  subject: Subject, //'FIRS-TSENTINEL ONBOARDING AND LOGIN DETAILS',
  // text: 'Hello, this is a test email from Node.js!', // plain text
  // or
  html: emailBody
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.log('Error! occured! from mail..');
        console.error(error);
            } else {
            console.log('No Error from mail..');
            console.log('Email sent: ' + info.response);
               }
        });


}

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
    const operating_licence_type = req.body.license_type;
    const proprietary_account = req.body.proprietary_account;


    console.log('The License TYPE:: ' +  req.body.license_type);
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
                // Send email here
                    console.log('Got to mail Sending..');
                    sendmail(company_name, email, 'FIRS-TSENTINEL ONBOARDING AND LOGIN DETAILS');

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
