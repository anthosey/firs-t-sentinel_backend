const express = require('express');
const mongoose = require('mongoose');
mongoose.set('strictQuery', true); //True ensures that all queries must not allow the fields that are not in the schema to run
const bodyParser = require('body-parser');
const defaultRoutes = require('./routes/default');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const operationzRoutes = require('./routes/operationz');
const session = require('express-session');
const Vat = require ('./models/vat')
const Company = require('./models/company');
const Ngxdata = require('./models/ngxdata');
const NegotiatedDeal = require('./models/negotiated_deal');

var http = require('http');
var https = require('https');
const path = require('path');
const dotenv = require('dotenv');
const axios = require('axios');
const qs = require('qs');

const dns = require('dns');

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

// Set DNS servers
dns.setServers(['8.8.8.8', '8.8.4.4']); // Google's public DNS servers


// Testing dotenv
const result = dotenv.config({ path: path.resolve(__dirname, 'envVar.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
} else {
  console.log('.env file loaded successfully');
}

// End of testing


const cron = require("node-cron"); // Cron jobs
// const path = require('path');
const { JsonWebTokenError } = require('jsonwebtoken');
const app = express();
global.taxProloginStatus = false; // CREATE A GLOBAL VARIABLE
global.ngxLoginStatus = false;
global.companyData = [];
global.tinVerificationData = [];
global.taxProPayLiteral = -1;
global.savedDataCount = 0;
global.countData = 0;
global.ngxResponseData = [];
global.dataApiCalledForTheDay = false;
global.provider_code = '';
let ext;
// This is for image upload capabilities using multer middleware
// const fileStorage = multer.diskStorage({
    
//   destination: (req, file, cb) => {
//       cb(null, 'images');
//   },

//   filename: (req, file, cb) => {
//       if (file.mimetype === 'image/png') {
//           ext = '.png';
//       }

//       if (file.mimetype === 'image/jpg') {
//           ext = '.jpg';
//       }

//       if (file.mimetype === 'image/jpeg') {
//           ext = '.jpeg';
//       }

//     //   cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname + ext);
//       cb(null, new Date().toISOString().replace(/:/g, '-') + '_' + file.originalname);
//       // cb(null, file.originalname + ext);
//   }
// });

// const fileFilter = (req, file, cb) => {
//   if (
//       file.mimetype === 'image/png' ||
//       file.mimetype === 'image/jpg' ||
//       file.mimetype === 'image/jpeg'
//   ) {
//       cb(null, true);
//   } else {
//       cb(null, false);
//   }
// }


//******  Set up Multer for file uploads Local disk
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//       cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//       cb(null, Date.now() + path.extname(file.originalname)); // Appending extension
//   }
// });
// const upload = multer({ storage: storage });

//*******End of Local disk file upload

// Configure the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
});

// Set up Multer-S3 for file uploads
const upload = multer({
  storage: multerS3({
      s3: s3,
      bucket: process.env.AWS_S3_BUCKET_NAME, // Set your S3 bucket name
      contentType: multerS3.AUTO_CONTENT_TYPE,
      // acl: 'public-read', // File access level (optional)
      key: function (req, file, cb) {
          cb(null, Date.now().toString() + path.extname(file.originalname)); // Appending extension
      }
  })
});

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
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    // res.setHeader('SameSite', 'None');
    
    next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(defaultRoutes);
app.use('/user', userRoutes);
app.use('/profile', profileRoutes);
app.use('/operationz', operationzRoutes);

const uploadRoutes = require('./routes/imgcoydata');
app.use('/imgcompany', uploadRoutes(upload));

app.use((error, req, res, next) => {
    console.log('Error: ' + error.message);
    const status = error.statusCode || 500;
    const msg = error.message; 
    const data = error.data;
    res.status(status).json({message: msg, data: data});
})


global.bearerToken = '';
global.ngxBearerToken = '';

// 6 asteriks  * * * * * * === s(0 - 59) m(0 - 59) h(0 - 23) d(1 - 31) m(1 -12) dow(0 - 6) (0 and 7 both represent Sunday)
// cron.schedule("* * * * *", function () {
//     console.log("---------------------");
//     console.log("running a task every minute");
// });

// *****CHECK ENV. VARIABLES******

function checkVariables(){
  try {
    if (!process.env.TAXPRO_EMAIL || !process.env.TAXPRO_PASSWORD || !process.env.DB_CONNECTION || !process.env.TIN_VER_HOSTNAME ||
      !process.env.TAXPRO_HOSTNAME || !process.env.TAXPRO_PATH || !process.env.TIN_VER_USERNAME || !process.env.TIN_VER_PASS || !process.env.KOKORO_IWOLE ||
      !process.env.TAXPRO_PORT || !process.env.DB_CONNECTION || !process.env.SESSION_SECRET || !process.env.SECRET_NAME) {
      throw new Error("Some environment Variables not found");
    };

  } catch (err) {
    // next(err);
    console.log("Error: " + err);
  }
}

checkVariables();

// Create the request body -TESTING ENV
// const testLoginData = JSON.stringify({
//     email: process.env.TAXPRO_EMAIL,
//     password: process.env.TAXPRO_PASSWORD
//   });

  // LIVE ENV
  const testLoginData = JSON.stringify({
    email: process.env.TAXPRO_EMAIL_LIVE,
    password: process.env.TAXPRO_PASSWORD_LIVE
  });

  
// TEST ENV
// const testLoginOptions = {
//       hostname: process.env.TAXPRO_HOSTNAME,
//       path: process.env.TAXPRO_PATH,
//       method: 'POST',
//       port: process.env.TAXPRO_PORT,
//       headers: {
//         'Content-Type': 'application/json',
//         'Content-Length': Buffer.byteLength(testLoginData),
//   },
// };

// LIVE ENV
const testLoginOptions = {
  hostname: process.env.TAXPRO_HOSTNAME_LIVE,
  // path: process.env.TAXPRO_LOGIN_PATH,
  method: 'POST',
  // port: process.env.TAXPRO_PORT,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(testLoginData),
},
};


const apiUrl = process.env.TAXPRO_HOSTNAME_LIVE;
const email = process.env.TAXPRO_EMAIL_LIVE;
const password = process.env.TAXPRO_PASSWORD_LIVE;
const ngxURl = process.env.NGX_URL;
const ngxUsername = process.env.NGX_USERNAME;
const ngxPassword = process.env.NGX_PASSWORD;
const ngxGrantType = process.env.NGX_GRANTTYPE;
const ngxDataUrl = process.env.NGX_DATA_URL;

async function logonToTaxpro() {
  console.log('Im here now');
  let token = '';
  try {
    const response = await axios.post(apiUrl, {
      email: email,
      password: password
      
   
    });
    token = response.data.token;
    bearerToken = response.data.token;
    taxProloginStatus = true;
  } catch (error) {
    taxProloginStatus = false;
    console.error('Error logging in:', error.message);
    console.error('Error details:', error);
  }
}


// Login to NGX

async function logonToNGX() {
  // console.log('url:' + apiUrl);
try {
  const data = qs.stringify({
    username: ngxUsername,
    password: ngxPassword,
    grant_type: ngxGrantType
  });

  const response = await axios.post(ngxURl, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  // console.log('Login successful:', response.data);
  // console.log('ngxToken:', response.data.access_token);
  ngxBearerToken = response.data.access_token;
  ngxLoginStatus = true;
} catch (error) {
  console.error('Error logging in:', error.message);
  console.error('Error details:', error);
}
}


function setTradeDate() {
  var  mktDate = new Date();
  var dd = mktDate.getDate();
  var mm = mktDate.getMonth() + 1;
  var yyyy = mktDate.getFullYear();
  var trDate = yyyy + '-'+ mm + '-' + dd;
  return trDate
}


function integerDivision(dividend, divisor) {
  return Math.floor(dividend / divisor);
}

function duplicateRecords(records, targetCount) {
  const result = [];
  const totalRecords = records.length;
  const multipleDuplicate = integerDivision(targetCount,totalRecords);
  console.log('Multiple counts: ' + multipleDuplicate);
  
  console.log('Dup here::' + totalRecords);
  for (let i = 0; i < multipleDuplicate; i++) {
    // result.push(records[i % totalRecords]);
    ngxResponseData.splice(0,0, ...records); //Add found data to the array
  }
  
  console.log('RESULTS::' + result);
  console.log('A count::' + ngxResponseData.length);
  console.log('A records:: ' + ngxResponseData);
  return result;
}

// Get Data:
async function getDataFromNGX() {
  // const trDate = setTradeDate() ; // For real
  const trDate = '2022-06-06'; //set static for test purpose
  provider_code = "NGX01";
  // Check if token exists
  // if (ngxLoginStatus) {
  ngxBearerToken = 'MdRJDqXnwKqGLddKWYMOlT9Ht5-wszCMdp7eVFK8D06Z1-pdM2-PoyDlqWGnLCJdcQFtp27ElNa6_QcyHmNYX1ipuRmMU6cUQWv1aO2Fd_v4ZwFjSzTTKid3jvJyWQgvbD0ljik8Kwadmn_8gvppRfIlryuENbQsVZXeIqQwMOcmocLpeAIDtrCtEga1hpHf0_3hdO0rj3Au4bz7fmskk7pc61j09OAa87n9u4F2IsQK3kfZbf6RdN8v8Xxf1biP'
    console.log('got Token:' + ngxBearerToken);
    axios.get(ngxDataUrl, {
      headers: {
        'Authorization': `Bearer ${ngxBearerToken}`
      },
      params: {
        tradeDate: trDate
      }
    })
    .then(response => {
      countData = 0;
      savedDataCount = 0;
      //console.log('Response Data:', response.data);
      // console.log('Spread Data:' + [...response.data])
      ngxResponseData = response.data;

      countData = response.data.length; 
      // ******Temporar Code for record duplication
      // if (countData < 10000) {
      //   duplicateRecords(response.data, 110)
      // }
      // ******End of the temporary codes
      
      console.log('New Count: ' + ngxResponseData.length);
      const y = ngxResponseData[ngxResponseData.length - 1];
      console.log('LAST RECORD::' + y);
      console.log('JSON::' + JSON.stringify(y));

      countData =  ngxResponseData.length;

      for (i = 0; i < countData; i++) {
        savedDataCount +=1;
        const x = response.data[i];
        const ngxData = new Ngxdata({
        // trx_id: "trx_"+ trDate + "_" + i,
        trade_no: x.Trade_No,
        board: x.Board,
        security: x.Security,
        trade_time: x.Trade_Time,
        price: x.Price,
        qty: x.Qty,
        value: x.Value,
        settlement_value: x.SettlementValue,
        buy_firm_code: x.BuyFirmCode,
        buy_firm_name: x.BuyFirmName,
        sell_firm_code: x.SellFirmCode,
        sell_firm_name: x.SellFirmName,
        buy_trading_account: x.Buy_Trading_Account,
        sell_trading_account: x.Sell_Trading_Account
      });
      // ngxData.trx_id = "trx_002";
      ngxData.save();
    
      }
      console.log('SAved Data Count: ' +  savedDataCount);
      console.log('Received Data Count: ' +  countData);
      dataApiCalledForTheDay = true;
    })
    .catch(error => {
      ngxLoginStatus = false; // Direct the system to login again to NGX
      dataApiCalledForTheDay = false; // Data was not called successfully
      console.error('Error:', error);
    });
  // } else { //login to ngx
  //   console.log('Login again: NGX');
  //   logonToNGX()
  // }
  
}
 
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
          console.log('NEW DATA AFTER PARSE::' + newData);
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


// function submitDataToTaxPro_old(dataInput, token, live) {
//   let data = '';
//   let dataOptions;
//   const dataIn = JSON.stringify({

//     //**** Remove the comment here before going live
//       // agent_tin: dataInput.agent_tin,
//       // beneficiary_tin: dataInput.beneficiary_tin,
// // ***These are for testing purpose only

//       agent_tin: '00000000-0000',
//       beneficiary_tin: '00000000-0000',

//       currency: dataInput.currency,
//       trans_date: dataInput.transaction_date,
//       // trans_date: '2023-08-10',
//       base_amount: dataInput.base_amount,
//       vat_calculated: dataInput.vat,
//       total_amount: dataInput.total_amount,
//       other_taxes: dataInput.other_taxes,
//       vat_rate: dataInput.vat_rate,
//       vat_status: dataInput.vat_status,
//       item_description: dataInput.item_description,
//       vendor_transaction_id: dataInput.item_id,
//       integrator_id: 27
//     });
      
//     console.log('DATAIN:: ' + dataIn);
//   // if (live) { // Data Options for Live Environment
//       dataOptions = {
//           hostname: process.env.TAXPRO_HOSTNAME,
//           // path: '/vat-aggr/transaction',
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': 'Bearer ' + token,
//             'Content-Length': Buffer.byteLength(dataIn),
//       },
//       };

//   // } else{ // Data Options for Test Environment
//   //  dataOptions = {
//   //     hostname: process.env.TAXPRO_HOSTNAME,
//   //     path: '/vat-aggr/transaction',
//   //     method: 'POST',
//   //     port: process.env.TAXPRO_PORT,
//   //     headers: {
//   //       'Content-Type': 'application/json',
//   //       'Authorization': 'Bearer ' + token,
//   //       'Content-Length': Buffer.byteLength(dataIn),
//   // },
//   // };

//   // }
   
  
//   const request = http.request(dataOptions, (response) => {
//     response.setEncoding('utf8');

//     response.on('data', (chunk) => {
//       data += chunk;
//     });

//     response.on('end', () => {
//       console.log('Returned Data:: ' + data);

//       if (data === 'error msg') {
//           // Ask the Login process to reinitiate login
//           taxProloginStatus = false;
//       } else {

//           var newData = JSON.parse(data);
//           trans_id = newData.trans_id;

//           // Update record in as sent in the local db
          
//           Vat.findOne({item_id: dataInput.item_id})
//           // Vat.findOne({_id: dataInput._id})
//               .then(vatFound =>{
//                   vatFound.taxpro_trans_id = trans_id;
//                   vatFound.data_submitted = 1; 
//                   return vatFound.save();
//               })
//               .then(vat => {
//                   console.log('Vat Data:: ' + vat);
//                   companyData.splice(0,1); // Start from the first, remove 1 element
//                   // res.status(201).json({message: 'Data Transmitted successfully', data: vat});

//               })
//               .catch(err => {
//                   if (!err.statusCode) {
//                       err.statusCode = 500;
//                   }
//                   // next(err); // pass the error to the next error handling function
//               });

//           return trans_id;
//           console.log('Data submitted to TaxPro successfully! TRANS_ID:: ' + trans_id);
//       }
      
//     });
//   });


//   request.on('error', (error) => {
//     console.error(error);
//     taxProloginStatus = false;
//   });

//   // Write data to the request body
//   request.write(dataIn);

//   request.end();

  
// };

async function submitDataToTaxPro(dataInput, token) {
  hostUrl = process.env.TAXPRO_HOSTNAME;
  // console.log('-->>' + dataInput);


  const dataIn = {

    //**** Remove the comment here before going live
      // agent_tin: dataInput.agent_tin,
      // beneficiary_tin: dataInput.beneficiary_tin,
// ***These are for testing purpose only

      agent_tin: '00000000-0000',
      beneficiary_tin: '00000000-0000',

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
    };

    console.log('token Call: ' + token);
    // const newToken = '4901816|igqEL7uzX684moDpf8V5Vj4hCeoTLiqo9Kn2xmbx'
    // axios.post(hostUrl, {headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'Content-Type': 'application/json' // Set the content type to JSON
    //   }},
    //   dataIn)

      const headers = {
        'Authorization': `Bearer ${token}`, // Replace with your access token
        'Content-Type': 'application/json' // Set the content type to JSON
      };

      axios.post(hostUrl, dataIn, { headers })

    .then(response => {
      
      console.log('Trans id b4:: ' +  response.data.trans_id);
      const trans_id = response.data.trans_id;
          console.log('Trans id:: '+ trans_id);

          // Update record in as sent in the local db
          
          Vat.findOne({item_id: dataInput.item_id})
          // Vat.findOne({_id: dataInput._id})
              .then(vatFound =>{
                console.log('Trans id2:: '+ trans_id);
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

          // return trans_id;
          console.log('Data submitted to TaxPro successfully! TRANS_ID:: ' + trans_id);
    
    })
    .catch(error => {
      console.error('Error:', error);
    });
}


// Rem 6
function mopupTinVERIFICATION() {
  console.log('Gotto here...');
  Company.find({tax_office_id: null})
 .then(data => {
  console.log('Length:: ' + data.length);
  // console.log('Data:: ' + data[0]._id);
  tinVerificationData.splice(0,0, ...data);

 })
}

// End of Rem 6

   //  CHECK ACCESS TO TAXPRO

  
// Convert into vat
// processDataIntoVats(ngxResponseData[i]);

// end of Rem NGX_01


function resetNgxDataPickupParameters() {
  dataApiCalledForTheDay = false
}



function checkForProprietaryAccount(companyData, tradeData) {
  var ans = false
   // Check if Proprietary account
   try{

   
   if (companyData.operating_licence_type === 'Broker Dealer') {
    if (companyData.proprietary_account === tradeData.Buy_Trading_Account) {
      ans = true
    } else {
      ans = false
    }
  }
} catch {
  ans = false
}
  return ans
}


function checkForProprietaryAccountSeller(companyData, tradeData) {
  var ans = false
   // Check if Proprietary account
   try{

   
   if (companyData.operating_licence_type === 'Broker Dealer') {
    if (companyData.proprietary_account === tradeData.Sell_Trading_Account) {
      ans = true
    } else {
      ans = false
    }
  }
} catch {
  ans = false
}
  return ans
}

// async function checkForNegotiatedDeal(companyCode, tradeAccount) {
// negDeal = False
//  var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": companyCode, "customer_account_no": tradeAccount })
//  if (itIsNegDeal) {
//   negDeal = True
//  }
//  return negDeal
// }

function generateToken(n) {
  
  var add = 1, max = 12 - add;   // 12 is the min safe number Math.random() can generate without it starting to pad the end with zeros.   
  console.log(n);
  max        = Math.pow(10, n+add);
  var min    = max/10; // Math.pow(10, n) basically
  var number = Math.floor( Math.random() * (max - min + 1) ) + min;

  return ("" + number).substring(add); 
}


async function processDataIntoVats(oneData) {
  // const errors = validationResult(req);
  var msg;
  var token;
  // if (!errors.isEmpty()) {
  //     const error = new Error('Validation failed!');
  //     error.statusCode = 422;
  //     error.data = errors.array();
  //     throw error;
  // }
  console.log("Process Status: Started");
  
  const trxId = generateToken(10);

  var sector;
  var sub_sector;
  var trx_value;
  

  var company_name = oneData.BuyFirmName;
  var counter_party_name = oneData.SellFirmName;
  var company_code = oneData.BuyFirmCode;
  var counter_party_code = oneData.SellFirmCode;
  var volume = oneData.Qty;
  var price = oneData.Price;
  var stock = oneData.security;
  const trx_ref_provider = oneData.Trade_No;
  // const user_id = req.body.user_id;
  // const personal_id = req.body.personal_id;
  // const company_code = req.body.company_code;
  // const trx_type = req.body.trx_type;
  // const trade_type = req.body.trade_type;
  // const cscs_number = req.body.cscs_number;
  // const beneficiary_name = req.body.beneficiary_name;
  // const stock_symbol = req.body.stock_symbol;
  // const price = req.body.price;
  // const volume = req.body.volume;
  // const counter_party_code = req.body.counter_party_code;
  // const remarks = req.body.remarks;
  
  // const counter_party_beneficiary_name = req.body.counter_party_name;
  // const counter_party_cscs = req.body.counter_party_cscs;
  
  trx_value = (volume * price);
  

  // Identify data provider
  if (provider_code === 'NGX01') {
      sector = 'Capital Market';
  }

  

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


              var totalAmount = oneData.Qty * oneData.Price;
              var lowerCommission = 0;
              var upperCommission = 0;
              var upperVat = 0;
              var secFee = 0;
              var cscsFee = 0;
              var ngxFee = 0;
              var status = 0; //Status: 0: vatable, 1: zero-rated, 2: vat exempt
              var vatPercent = 7.5;
              var vat = 0;

              // Check for proprietary account
              var proprietary = checkForProprietaryAccount(main_company, oneData);
              if (proprietary) {
                // upperCommission = 0; 
                // upperVat = 0;
                vatPercent = 0;
                status = 1;
                vat = 0;
              } else {

                // CHECK FOR NEGOTIATED DEAL
                // - Stock-Bound
                var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": main_company.company_code, "customer_account_no": oneData.Buy_Trading_Account, "deal_type": "STOCK_BOUND", "stock_symbol": stock, "active": 1 })
                if (itIsNegDeal) {
                  // Use the negotiated rate
                  var rate = itIsNegDeal.negotiated_rate;
                  var commission = (rate * totalAmount)/100;
                  vat = (commission * vatPercent)/100;
                  status = 0;
                } else {

                    // - Account Bound
                    var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": main_company.company_code, "customer_account_no": oneData.Buy_Trading_Account, "deal_type": "ACCOUNT_BOUND", "active": 1 })
                    if (itIsNegDeal) {
                      // Use the negotiated rate
                      var rate = itIsNegDeal.negotiated_rate;
                      var commission = (rate * totalAmount)/100;
                      vat = (commission * vatPercent)/100;
                      status = 0;
                    } else {
                        // - Company Bound
                        var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": main_company.company_code, "customer_account_no": oneData.Buy_Trading_Account, "deal_type": "COMPANY_BOUND", "active": 1 })
                        if (itIsNegDeal) {
                         // Use the negotiated rate
                         var rate = itIsNegDeal.negotiated_rate;
                         var commission = (rate * totalAmount)/100;
                         vat = (commission * vatPercent)/100;
                         status = 0;
                      } else {
                              // Maintain normal rates
                              upperCommission = (1.35 * totalAmount)/100;
                              upperVat = (upperCommission * vatPercent)/100;
                              status = 0;

                              vat = upperVat;
                      }
                    } 

                  
                }
              }

              
              secFee = (0.3 * totalAmount)/100;
              cscsFee = (0.3 * totalAmount)/100;
              ngxFee = (0.3 * totalAmount)/100;
              lowerCommission = (0.75 * totalAmount)/100 ;
              var lowerVat = (lowerCommission * vatPercent)/100;
              
              // upperCommission = (1.35 * totalAmount)/100 ;
              // var upperVat = (upperCommission * 7.5)/100;

              var secVat = (secFee * 7.5)/100;
              var cscsVat = (cscsFee * 7.5)/100;
              var ngxVat = (ngxFee * 7.5)/100;
              
              var mktDate = new Date();
              var dd = mktDate.getDate();
              var mm = mktDate.getMonth();
              var yyyy = mktDate.getFullYear();
              var trDate = yyyy + '-'+ mm + '-' + dd;

              console.log('DATE::' + trDate);
              
              console.log("Process Status: initator Coy");

              console.log('Tr_Amount : ' + totalAmount + ', ')
              // Get Vat for Initiator Company (BUYER)
              const initiatorCompany = new Vat ({
              
                  trx_id: trxId,
                  transaction_ref: oneData.Trade_No,
                  cac_id: main_company.cac_id,
                  transaction_type: oneData.Board,
                  trade_type: "Buy",
                  tin: main_company.tin,
                  agent_tin: main_company.tin, 
                  beneficiary_tin: main_company.tin,
                  currency: 1,
                  transaction_amount: totalAmount,
                  vat: vat,
                  vat_rate: vatPercent,
                  
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
                  transaction_date: oneData.Trade_Time,
                  data_submitted: 0,
                  vat_rate: vatPercent,
                  // vat_status: 0,
                  vat_status: status, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                  item_id: trxId + '1',
                  earning_type: 'Commission',
                  region: main_company.region,
                  state: main_company.state,
                  trans_threshold: main_company.trans_threshold
                  
          
              });

              await initiatorCompany.save();
              companyData.push (initiatorCompany);

              console.log("Process Status: Initiator Saved");

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




           // Get Vat for Counterparty Company (SELLER)
           vatPercent = 7.5;
               // Check for proprietary account
               var proprietary = checkForProprietaryAccountSeller(counterparty_company, oneData);
               if (proprietary) {
                  // upperCommission = 0; 
                // upperVat = 0;
                vatPercent = 0;
                status = 1;
                vat = 0;
               } else {

                  // CHECK FOR NEGOTIATED DEAL
                  // - Stock-Bound
                  var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": counterparty_company.company_code, "customer_account_no": oneData.Sell_Trading_Account, "deal_type": "STOCK_BOUND", "stock_symbol": stock, "active": 1 })
                  if (itIsNegDeal) {
                    // Use the negotiated rate
                    var rate = itIsNegDeal.negotiated_rate;
                    var commission = (rate * totalAmount)/100;
                    vat = (commission * vatPercent)/100;
                    status = 0;
                  } else {
  
                      // - Account Bound
                      var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": counterparty_company.company_code, "customer_account_no": oneData.Sell_Trading_Account, "deal_type": "ACCOUNT_BOUND", "active": 1 })
                      if (itIsNegDeal) {
                        // Use the negotiated rate
                        var rate = itIsNegDeal.negotiated_rate;
                        var commission = (rate * totalAmount)/100;
                        vat = (commission * vatPercent)/100;
                        status = 0;
                      } else {
                          // - Company Bound
                          var itIsNegDeal = await NegotiatedDeal.findOne({"company_code": counterparty_company.company_code, "customer_account_no": oneData.Sell_Trading_Account, "deal_type": "COMPANY_BOUND", "active": 1 })
                          if (itIsNegDeal) {
                           // Use the negotiated rate
                           var rate = itIsNegDeal.negotiated_rate;
                           var commission = (rate * totalAmount)/100;
                           vat = (commission * vatPercent)/100;
                           status = 0;
                        } else {
                                // Maintain normal rates
                                upperCommission = (1.35 * totalAmount)/100;
                                upperVat = (upperCommission * vatPercent)/100;
                                status = 0;
  
                                vat = upperVat;
                        }
                      } 
  
                    
                  }
                }
  
 
              const counterpartyCompany = new Vat ({
                      trx_id: trxId,
                      transaction_ref: oneData.Trade_No,
                      cac_id: counterparty_company.cac_id,
                      transaction_type: oneData.Board,
                      trade_type: "Sell",
                      tin: counterparty_company.tin,
                      agent_tin: counterparty_company.tin, 
                      beneficiary_tin: counterparty_company.tin,
                      currency: 1,
                      transaction_amount: totalAmount,
                      vat: vat,
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
                      transaction_date: oneData.Trade_Time,
                      data_submitted: 0,
                      vat_rate: vatPercent,
                      vat_status: status, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
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
                  vatPercent = 7.5;
                  const sec = new Vat ({
                          trx_id: trxId,
                          transaction_ref: oneData.Trade_No,
                          cac_id: sec_company.cac_id,
                          transaction_type: oneData.Board,
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
                          transaction_date: oneData.Trade_Time,
                          data_submitted: 0,
                          vat_rate: vatPercent,
                          vat_status: 0, //Status: 0: vatable, 1: zero-rated, 2: vat exempt
                          item_id: trxId + '3',
                          earning_type: 'Fee',
                          region: sec_company.region,
                          state: sec_company.state,
                          trans_threshold: sec_company.trans_threshold
                      });

                      await sec.save();      
                      companyData.push (sec);
                    
              // }

               // ********For sell orders*********
              //  if (trade_type == 'Sell') {
                  // Get Vat for NGX
                  vatPercent = 7.5;
                  const ngx = new Vat ({
                      trx_id: trxId,
                      transaction_ref: oneData.Trade_No,
                      cac_id: ngx_company.cac_id,
                      transaction_type: oneData.Board,
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
                      transaction_date: oneData.Trade_Time,
                      data_submitted: 0,
                      vat_rate: vatPercent,
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
              vatPercent = 7.5;
              const cscs = new Vat ({
                  trx_id: trxId,
                  transaction_ref: oneData.Trade_No,
                  cac_id: cscs_company.cac_id,
                  transaction_type: oneData.Board,
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
                  transaction_date: oneData.Trade_Time,
                  data_submitted: 0,
                  vat_rate: vatPercent,
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

              

              // console.log('record::' + dat + ', Trx ID::' + trxId);
          //     res.status(201).json({
          //         message: 'Transaction saved successfully',
          //         data: {trx_id: trxId,
                     
          //             remarks: remarks      }
          // })
      // })
              
          // .catch(err => {
          //     if (!err.statusCode) {
          //         err.statusCode = 500;
          //     }
          //     next(err); // pass the error to the next error handling function
          // });
         
  
// }
}

 

// Rem 7
function mopupData() {
  Vat.find({taxpro_trans_id: null})
  .then(data => {
   console.log('Length:: ' + data.length);
   // console.log('Data:: ' + data[0]._id);
   companyData.splice(0,0, ...data); //Add found data to the array
 
  })
 
 }
 // End of Rem 7
 

// Move data to TraxPro every 5 seconds
// instance 1
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 2
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 3
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 4
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 5
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 6
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 7
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 8
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 9
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })

  // instance 10
cron.schedule("*/5 * * * * *", function() {
  
  if (companyData.length > 0) {
    console.log('Total Data waiting to go to TaxPro: ' + companyData.length)
    // console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    console.log('Coy ID********: ' + companyData[0]._id);
    console.log('Coy Data length:: ' + companyData.length);

    // Get the data to TaxPro, and update the Local Db
    if (!bearerToken) { taxProloginStatus;} else {  // Check Taxpro Login Status
      submitDataToTaxPro(companyData[0], bearerToken);
    }

  }else{
    console.log('No data found!');
  } 
  
  })
  // End of Move data to TaxPro

// Taxpro Offline handler: checks for data that could not be uploaded to Taxpro realtime and upload them

  // rem 3 
  // cron.schedule("0 23 * * *", function() { // @ 23:00 pm every day
  // ***** = mn hr day mn day of the week. * means 'every' i.e * in the position of day means everyday 
  cron.schedule("44 14 * * *", function() { // @ 23:00 pm every day
  console.log('Daily Data Mop-up'); 
    mopupData();
})

// End of Rem 3
  
// Call Tin Verification from here to validate new companies


// TIN VERIFICATION Offline handler:
cron.schedule("5 2 * * *", function() { // 2:05 am
  console.log('Daily TIN Data Mop-up'); 
    mopupTinVERIFICATION();
})

//  rem 1
cron.schedule("* * * * *", function () {
  console.log("---------------------");
  // console.log("Checking login every 1 min" + ':: Token:'); 

  console.log('STATUS: '+ taxProloginStatus);

  if (!taxProloginStatus) {
      logonToTaxpro(testLoginOptions);
      
  } else {console.log('TaxPro Login active!, Token:: ' + bearerToken );}
});

// end of Rem 1


//  rem NGX_01: Check Login
cron.schedule("* * * * *", function () {
console.log("---------------------");
// console.log("Checking NGX login every 1 min" + ngxBearerToken); 

console.log('STATUS: '+ ngxLoginStatus);

if (!ngxLoginStatus) {
    logonToNGX();
    
} else {console.log('NGX Login active!, Token:: ' + ngxBearerToken );}
});



// rem NGX_02: Reset parameters
cron.schedule("0 1 * * *", function() { // @ 1:00 am every day
console.log('Reset NGX data call parameters');
resetNgxDataPickupParameters()
})


// *****Check with the NGX to ask for the data for the day
cron.schedule("57 16 * * *", function() { // @ 4:57Pm (57 16)every day
if (!dataApiCalledForTheDay) {
  console.log('Call NGX for data');
  getDataFromNGX();
} else {
  console.log('Data already gotten for today.');
}

})


// // **** PROCESS THE DATA FOR VAT GENERATION
// cron.schedule("*/5 * * * *", function() { // every 30 min
// if (ngxResponseData.length > 0) {
//   console.log('Processing data for vat');
//   const qty = ngxResponseData[0].qty;
//   const price = ngxResponseData[0].price;
//   // processDataIntoVats(qty, price);
// } else {
//   console.log('No data is waiting!.');
// }

// })


// **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 10 secs");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });


  
  // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 2");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });


    // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 3");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });


    // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 4");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });


      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 5");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });

      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 6");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });

      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 7");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } // else {
    //   console.log("No Data to process!");
    // }
  
  });

      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 8");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });


      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  // console.log("testing 1 sec 9");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } //else {
    //   console.log("No Data to process!");
    // }
  
  });
  

      // **** PROCESS THE DATA FOR VAT GENERATION
cron.schedule("*/1 * * * * *", function () {
  console.log("testing 1 sec 10");
  if (ngxResponseData.length > 0) {

      const x = ngxResponseData.splice(0, 1);
      processDataIntoVats(x[0]);
      console.log('Done!:: ' + ngxResponseData.length + ', ' + x[0]);
      console.log('Qty:: ' + x[0].Qty)
    } else {
      console.log("No Data to process!");
    }
  
  });

  // Rem 4
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

// job.start();

// logonToNGX();
getDataFromNGX();  //******To be removed when going live

mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true })


.then(result => {
    console.log('app running on port 8081');
    app.listen(process.env.PORT || 8081);
    logonToTaxpro();
})
.catch(err => {
    console.log('Error: ' + err);
})

