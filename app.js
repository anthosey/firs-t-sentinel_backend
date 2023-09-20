const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const defaultRoutes = require('./routes/default');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const operationzRoutes = require('./routes/operationz');
const session = require('express-session');
const Vat = require ('./models/vat')
const Company = require('./models/company');
var http = require('http');
var https = require('https');
require("dotenv").config();

const cron = require("node-cron"); // Cron jobs
const path = require('path');
const { JsonWebTokenError } = require('jsonwebtoken');
const app = express();
global.taxProloginStatus = false; // CREATE A GLOBAL VARIABLE
global.companyData = [];
global.tinVerificationData = [];
global.taxProPayLiteral = -1;
let ext;
// This is for image upload capabilities using multer middleware
const fileStorage = multer.diskStorage({
    
  destination: (req, file, cb) => {
      cb(null, 'images');
  },

  filename: (req, file, cb) => {
      if (file.mimetype === 'image/png') {
          ext = '.png';
      }

      if (file.mimetype === 'image/jpg') {
          ext = '.jpg';
      }

      if (file.mimetype === 'image/jpeg') {
          ext = '.jpeg';
      }

    //   cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname + ext);
      cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname);
      // cb(null, file.originalname + ext);
  }
});

const fileFilter = (req, file, cb) => {
  if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
  ) {
      cb(null, true);
  } else {
      cb(null, false);
  }
}

const sessionConfig = {
    secret: process.env.SESSION_SECRET,
    name: process.env.SECRET_NAME,
    resave: false,
    saveUninitialized: false,
    // store: store,
    cookie : {
      sameSite: 'none', // THIS is the config you are looing for.
    }
  };
  
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
    sessionConfig.cookie.secure = true; // serve secure cookies
  }
  
  app.use(session(sessionConfig));
  app.use('/images', express.static(path.join(__dirname, 'images')));
  
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // res.setHeader('SameSite', 'None');
    
    next();
});

// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json()); // application/json
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

// For Express versionn above 4.16, bodyParser has been included
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));


// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
// app.use(bodyParser.json())

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));




app.use(defaultRoutes);
app.use('/user', userRoutes);
app.use('/profile', profileRoutes);
app.use('/operationz', operationzRoutes);

app.use((error, req, res, next) => {
    console.log('Error: ' + error.message);
    const status = error.statusCode || 500;
    const msg = error.message; 
    const data = error.data;
    res.status(status).json({message: msg, data: data});
})


global.bearerToken = '';

// 6 asteriks  * * * * * * === s(0 - 59) m(0 - 59) h(0 - 23) d(1 - 31) m(1 -12) dow(0 - 6) (0 and 7 both represent Sunday)
// cron.schedule("* * * * *", function () {
//     console.log("---------------------");
//     console.log("running a task every minute");
// });

// *****CHECK ENV. VARIABLES******

function checkVariables(){
  try {
    if (!process.env.TAXPRO_EMAIL || !process.env.TAXPRO_PASSWORD || !process.env.DB_CONNECTION || !process.env.TIN_VER_HOSTNAME ||
      !process.env.TAXPRO_HOSTNAME || !process.env.TAXPRO_PATH || !prpcess.env.TIN_VER_USERNAME || !process.env.TIN_VER_PASS || !process.env.KOKORO_IWOLE ||
      !process.env.TAXPRO_PORT || !process.env.DB_CONNECTION || !process.env.SESSION_SECRET || !process.env.SECRET_NAME) {
      throw new Error("Some environment Variables not found");
    };

  } catch (err) {
    // next(err);
    console.log("Error: " + err);
  }
}

checkVariables();

// Create the request body
const testLoginData = JSON.stringify({
    email: process.env.TAXPRO_EMAIL,
    password: process.env.TAXPRO_PASSWORD
  });

  
const testLoginOptions = {
      hostname: process.env.TAXPRO_HOSTNAME,
      path: process.env.TAXPRO_PATH,
      method: 'POST',
      port: process.env.TAXPRO_PORT,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testLoginData),
  },
};
  
function logonToTaxpro(options) {
        let data = '';
        let token = '';
      
        const request = http.request(options, (response) => {
          response.setEncoding('utf8');
      
          response.on('data', (chunk) => {
            data += chunk;
          });
      
          response.on('end', () => {
            // console.log(data);
            try {
              newData = JSON.parse(data);
              bearerToken = newData.token;
              taxProloginStatus = true;
              console.log('Login to TaxPro successful!');
            }

            catch {
              taxProloginStatus = false;
              console.log('Unable to login to Taxpro');
            }

            finally {

            }
            
          });
        });
    
    
        request.on('error', (error) => {
          console.error(error);
        });
      
        // Write data to the request body
        request.write(testLoginData);
      
        request.end();
    
        
      };

 
function getRegion (states) {
  var state = states.toUpperCase();
  var region="";
  switch (state) {
    case 'BENUE': region = "North Central"; break;
    case 'KOGI': region = "North Central"; break;
    case 'KWARA': region = "North Central"; break;
    case 'NASARAWA': region = "North Central"; break;
    case 'NIGER': region = "North Central"; break;
    case 'PLATEAU': region = "North Central"; break;
    case 'FCT': region = "North Central"; break;

    case 'ADAMAWA': region = "North East"; break;
    case 'BAUCHI': region = "North East"; break;
    case 'BORNO': region = "North East"; break;
    case 'GOMBE': region = "North East"; break;
    case 'TARABA': region = "North East"; break;
    case 'YOBE': region = "North East"; break;

    case 'JIGAWA': region = "North West"; break;
    case 'KADUNA': region = "North West"; break;
    case 'KANO': region = "North West"; break;
    case 'KATSINA': region = "North West"; break;
    case 'KEBBI': region = "North West"; break;
    case 'SOKOTO': region = "North West"; break;
    case 'ZAMFARA': region = "North West"; break;

    case 'ABIA': region = "South East"; break;
    case 'ANAMBRA': region = "South East"; break;
    case 'EBONYI': region = "South East"; break;
    case 'ENUGU': region = "South East"; break;
    case 'IMO': region = "South East"; break;

    case 'AKWA IBOM': region = "South South"; break;
    case 'BAYELSA': region = "South South"; break;
    case 'CROSS RIVER': region = "South South"; break;
    case 'DELTA': region = "South South"; break;
    case 'EDO': region = "South South"; break;
    case 'RIVERS': region = "South South"; break;

    case 'EKITI': region = "South West"; break;
    case 'LAGOS': region = "South West"; break;
    case 'OGUN': region = "South West"; break;
    case 'ONDO': region = "South West"; break;
    case 'OSUN': region = "South West"; break;
    case 'OYO': region = "South West"; break;
    
    default: region = "Invalid State"

  }
  return region.toUpperCase();
}

function getThreshold(addy) {
  let x =-1;
  let thresh = '';
  var addy = addy.toUpperCase();
  // var addy = 'MTO TELECOMS AND BROADCASTING';
// console.log('Addy Receu::' + addy.indexOf('MTSO'));
  if (addy.indexOf('MSTO') >= 0) {
    thresh = 'MSTO'; 
    // thresh = 'BROAD'; 
  }else {
    // thresh = 'NOT FOUND';}
    if (addy.indexOf('LTO') >= 0) {
      thresh = 'LTO';
    } else {
      if (addy.indexOf('MTO') >= 0) {
        thresh = 'MTO';
      } else {
        if (addy.indexOf('GBTO') >= 0) {
          thresh = 'GBTO';
        } else {
          if (addy.indexOf('DMO') >= 0) {
            thresh = 'DMO';
            }
        }
      
      }
    }
  }
  
  

  // switch(addy) {

  // }

  console.log('Thrwsh Found!:: ' + thresh);
return thresh;


}

function validateTinFromFIRS(tin) {
  let data = '';
  let state = '';
  let region = '';
  let threshold = '';

  let dataOptions;
  // console.log('TIN-API called! user: ' + username + ', pass: '+ passw + ', Tin: ' + tin);
  const dataIn = JSON.stringify({
      tin: tin  });
      
    console.log('DATAIN:: ' + dataIn);
  // if (live) { // Data Options for Live Environment
      dataOptions = {
          hostname: process.env.TIN_VER_HOSTNAME,
          path: '/apis/tinvalidation/' + tin,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + Buffer.from(process.env.TIN_VER_USERNAME + ':' + process.env.TIN_VER_PASS).toString('base64'),
            // 'Content-Length': Buffer.byteLength(dataIn),
      },
      };
   
  
  const request = https.request(dataOptions, (response) => {
    response.setEncoding('utf8');

    response.on('data', (chunk) => {
      data += chunk;
    });

    response.on('end', () => {
      console.log('Returned Data:: ' + data);
      var newData = JSON.parse(data);
      console.log('Returned Data message:: ' + newData.Message);

      if (newData.Message === 'TIN Not Found') {
          // Ask the Login process to reinitiate login
          // taxProloginStatus = false;
          console.log('INVALID TIN');
          tinVerificationData.splice(0,1); // Start from the first, remove 1 element
      } else {

          var newData = JSON.parse(data);
          console.log('NEW DATA AFTER PSRSE::' + newData);
          console.log('TIN DATA:: ' + newData.Address);

          // console.log('DATum Chunk:: ' + data);
          // console.log('DATum:: ' + data.Address);

          var myString = newData.Address;
          myString = myString.split(" ");
          state = myString.at(myString.length - 1);
          console.log('STATE:: ' + state);

          console.log('Offic Name::' + newData.TaxOfficeName);

          // Get Region
          region = getRegion(state);
          threshold = getThreshold(newData.TaxOfficeName);
          console.log("Threshold::" + threshold);

          // Update record in as sent in the local db
          Company.findOne({tin: tin})
          
              .then(coyFound =>{
                  coyFound.region = region;
                  coyFound.state = state;
                  coyFound.trans_threshold = threshold;
                  coyFound.jtbtin = newData.JTBTIN;
                  coyFound.taxpayer_name = newData.TaxPayerName;
                  coyFound.taxpayer_address = newData.Address;
                  coyFound.tax_office_id = newData.TaxOfficeId;
                  coyFound.tax_office_name = newData.TaxOfficeName;
                  coyFound.taxpayer_type = newData.TaxPayerType;
                  coyFound.taxpayer_rc = newData.RCNumber;
                  coyFound.taxpayer_email = newData.Email;
                  coyFound.taxpayer_phone = newData.Phone;
                  coyFound.tin_verified = 1;


                  return coyFound.save();
              })
              .then(tin => {
                  console.log('Coy Data:: ' + tin);
                  tinVerificationData.splice(0,1); // Start from the first, remove 1 element
                  
              })
              .catch(err => {
                  if (!err.statusCode) {
                      err.statusCode = 500;
                  }
                  // next(err); // pass the error to the next error handling function
              });

          // return trans_id;
          // console.log('Data submitted to TaxPro successfully! TRANS_ID:: ' + trans_id);
      }
      
    });
  });


  request.on('error', (error) => {
    console.error(error);
    taxProloginStatus = false;
  });

  // Write data to the request body
  request.write(dataIn);

  request.end();

  
};


function submitDataToTaxPro(dataInput, token, live) {
  let data = '';
  let dataOptions;
  const dataIn = JSON.stringify({
      agent_tin: dataInput.agent_tin,
      beneficiary_tin: dataInput.beneficiary_tin,
      currency: dataInput.currency,
      trans_date: dataInput.transaction_date,
      // trans_date: '2023-08-10',
      base_amount: dataInput.base_amount,
      vat_calculated: dataInput.vat,
      total_amount: dataInput.total_amount,
      other_taxes: dataInput.other_taxes,
      vat_rate: dataInput.vat_rate,
      vat_status: dataInput.vat_status,
      item_description: dataInput.item_description,
      vendor_transaction_id: dataInput.item_id,
      integrator_id: 27
    });
      
    console.log('DATAIN:: ' + dataIn);
  if (live) { // Data Options for Live Environment
      dataOptions = {
          hostname: process.env.TAXPRO_HOSTNAME,
          path: '/vat-aggr/transaction',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'Content-Length': Buffer.byteLength(dataIn),
      },
      };

  } else{ // Data Options for Test Environment
   dataOptions = {
      hostname: process.env.TAXPRO_HOSTNAME,
      path: '/vat-aggr/transaction',
      method: 'POST',
      port: process.env.TAXPRO_PORT,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        'Content-Length': Buffer.byteLength(dataIn),
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

      if (data === 'error msg') {
          // Ask the Login process to reinitiate login
          taxProloginStatus = false;
      } else {

          var newData = JSON.parse(data);
          trans_id = newData.trans_id;

          // Update record in as sent in the local db
          
          Vat.findOne({item_id: dataInput.item_id})
          // Vat.findOne({_id: dataInput._id})
              .then(vatFound =>{
                  vatFound.taxpro_trans_id = trans_id;
                  vatFound.data_submitted = 1; 
                  return vatFound.save();
              })
              .then(vat => {
                  console.log('Vat Data:: ' + vat);
                  companyData.splice(0,1); // Start from the first, remove 1 element
                  // res.status(201).json({message: 'Data Transmitted successfully', data: vat});

              })
              .catch(err => {
                  if (!err.statusCode) {
                      err.statusCode = 500;
                  }
                  // next(err); // pass the error to the next error handling function
              });

          return trans_id;
          console.log('Data submitted to TaxPro successfully! TRANS_ID:: ' + trans_id);
      }
      
    });
  });


  request.on('error', (error) => {
    console.error(error);
    taxProloginStatus = false;
  });

  // Write data to the request body
  request.write(dataIn);

  request.end();

  
};


function mopupData() {
 Vat.find({taxpro_trans_id: null})
 .then(data => {
  console.log('Length:: ' + data.length);
  // console.log('Data:: ' + data[0]._id);
  companyData.splice(0,0, ...data);

 })

}

function mopupTinVERIFICATION() {
  console.log('Gotto here...');
  Company.find({tax_office_id: null})
 .then(data => {
  console.log('Length:: ' + data.length);
  // console.log('Data:: ' + data[0]._id);
  tinVerificationData.splice(0,0, ...data);

 })
}

   //  CHECK ACCESS TO TAXPRO

   cron.schedule("*/10 * * * * *", function () {
    console.log("---------------------");
    console.log("Checking login every 10 secs" + ':: Token:'); 

    console.log('STATUS: '+ taxProloginStatus);

    if (!taxProloginStatus) {
        logonToTaxpro(testLoginOptions);
        
    } else {console.log('TaxPro Login active!, Token:: ' + bearerToken );}
});

// Move data to TraxPro every 5 seconds
cron.schedule("*/5 * * * * *", function() {
  if (companyData.length > 0) {
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken, false);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

 
  // Taxpro Offline handler: checks for data that could not be uploaded to Taxpro realtime and upload them
cron.schedule("0 */59 */12 * * *", function() { // 2:05 am
  console.log('Daily Data Mop-up'); 
    mopupData();
})

  
// Call Tin Verification from here to validate new companies
cron.schedule("*/10 * * * * *", function() { // 2:05 am
  if (tinVerificationData.length > 0) {
    console.log('TIN Data length:: ' + tinVerificationData.length);

    var tin = tinVerificationData[0].tin;
  console.log('Calling TIN now....'); 
  validateTinFromFIRS(tin);
  }else {
    console.log('No TIN verification Data found!');
  }
  
})

// TIN VERIFICATION Offline handler:
cron.schedule("0 */23 */19 * * *", function() { // 2:05 am
  console.log('Daily TIN Data Mop-up'); 
    mopupTinVERIFICATION();
})




// job.start();


mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect('mongodb+srv://anthos:anth05.p%4055@alaarudata-mlyhh.mongodb.net/alaaruDb?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true })

.then(result => {
    console.log('app running on port 8081');
    app.listen(process.env.PORT || 8081);
})
.catch(err => {
    console.log('Error: ' + err);
})

