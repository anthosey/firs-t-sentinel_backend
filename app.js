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
var http = require('http');
require("dotenv").config();

const cron = require("node-cron"); // Cron jobs
const path = require('path');
const app = express();
global.taxProloginStatus = false; // CREATE A GLOBAL VARIABLE
global.companyData = [];
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


// global.bearerToken = '';

// 6 asteriks  * * * * * * === s(0 - 59) m(0 - 59) h(0 - 23) d(1 - 31) m(1 -12) dow(0 - 6) (0 and 7 both represent Sunday)
// cron.schedule("* * * * *", function () {
//     console.log("---------------------");
//     console.log("running a task every minute");
// });

// *****CHECK ENV. VARIABLES******
// function checkVariables(){
//   try {
//     if (!process.env.TAXPRO_EMAIL || !process.env.TAXPRO_PASSWORD || 
//       !process.env.TAXPRO_HOSTNAME || !process.env.TAXPRO_PATH || 
//       !process.env.TAXPRO_PORT || !process.env.DB_CONNECTION || !process.env.SESSION_SECRET || !process.env.SECRET_NAME) {
//       throw new Error("Some environment Variables not found");
//     };

//   } catch (err) {
//     // next(err);
//     console.log("Error: " + err);
//   }
// }

// checkVariables();

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
            console.log(data);
            newData = JSON.parse(data);
            bearerToken = newData.token;
            taxProloginStatus = true;
            console.log('Login to TaxPro successful!');
            
          });
        });
    
    
        request.on('error', (error) => {
          console.error(error);
        });
      
        // Write data to the request body
        request.write(testLoginData);
      
        request.end();
    
        
      };

    //  CHECK ACCESS TO TAXPRO

cron.schedule("*/10 * * * * *", function () {
    console.log("---------------------");
    console.log("Checking login every 10 secs" + ':: Token:'); 

    console.log('STATUS: '+ taxProloginStatus);

    if (!taxProloginStatus) {
        logonToTaxpro(testLoginOptions);
        
    } else {console.log('TaxPro Login active!, Token:: ' + bearerToken );}
});


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
            'Authorization': token,
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
          
          Vat.findOne({agent_tin: dataInput.agent_tin} && {trx_id: dataInput.trx_id})
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


cron.schedule("*/45 * * * * *", function() {
  if (companyData.length > 0) {
    console.log('Coy Data: ' + companyData[0]);
    console.log('Coy ********: ' + companyData[0].company_name);
    // Get the data to TaxPro, then update the Local Db

    submitDataToTaxPro(companyData[0], bearerToken, false);

  }else{
    console.log('No data found!');
  } 
  
  })

mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect('mongodb+srv://anthos:anth05.p%4055@alaarudata-mlyhh.mongodb.net/alaaruDb?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true })

.then(result => {
    console.log('app running on port 8081');
    app.listen(process.env.PORT || 8081);
})
.catch(err => {
    console.log('Error: ' + err);
})

