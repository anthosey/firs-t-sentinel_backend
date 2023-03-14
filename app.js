const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const defaultRoutes = require('./routes/default');
const userRoutes = require('./routes/user');
const profileRoutes = require('./routes/profile');
const operationzRoutes = require('./routes/operationz');
const session = require('express-session');


const path = require('path');
const app = express();

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
    secret: 'Tonesentinel',
    name: 'TsentinelSecret1',
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

mongoose.connect('mongodb+srv://anthos:T-one.Pass@t-onedb.ahkgwe7.mongodb.net/?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true })
// mongoose.connect('mongodb+srv://anthos:anth05.p%4055@alaarudata-mlyhh.mongodb.net/alaaruDb?retryWrites=true&w=majority', {useNewUrlParser: true, useUnifiedTopology: true })

.then(result => {
    console.log('app running on port 8081');
    app.listen(process.env.PORT || 8081);
})
.catch(err => {
    console.log('Error: ' + err);
})

