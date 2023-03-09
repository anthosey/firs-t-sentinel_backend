const express = require('express');
const userController = require('../controllers/user');
const router = express.Router();
const { body } = require('express-validator');
// const Client = require('../models/client');
const User = require('../models/user');

// const isAuth = require('../middleware/isAuth');

// router.get('/drivers', isAuth, userController.getDrivers);
router.get('/users', userController.getUsers);
router.get('/oneuser/:username', userController.getOneUser);

// router.get('/countrycode/:code', userController.getCountryCodes);

router.post('/signupuser', [
                    body('email')
                    .isEmail()
                    .withMessage('Please enter a valid email.')
                    .custom((value, { req }) => {
                        return User.findOne({email: value}).then(userDoc => {
                            if (userDoc) {
                                console.log('Yes it is Em' + userDoc);
                                return Promise.reject('E-mail address already exists');
                            }
                        });
                    })
                    .normalizeEmail(),
                    body('mobile')
                    .custom((value, { req }) => {
                        return User.findOne({mobile: value}).then(userDoc =>{
                            if (userDoc) {
                                console.log('Yes it is Mob' + userDoc);
                                return Promise.reject('Mobile number already exists');
                            }
                        });
                    }),
                    
                    body('password')
                        .trim()
                    .isLength({ min: 8})
                    .withMessage('Password must be 8 characters minimum!'),
                
                    body('firstname')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('Firstname must not be empty')], userController.createUser);

router.post('/userlogin', userController.userLogin);
// router.get('/admin', userController.admin);

router.post('/forgotpassword', userController.forgotPassword);
router.post('/confirmtoken', userController.confirmToken);
router.post('/resetpassword', userController.resetPassword);

router.post('/confirmmobiletoken', userController.confirmMobileToken);
router.post('/confirmemailtoken', userController.confirmEmailToken);
router.post('/sendtokentoemail', userController.generateTokenToEmail);
router.post('/changepassword', userController.changePassword);

router.post('/lockunlockuser', userController.lockunlock);

router.post('/uploadpassport', userController.uploadPassport);

module.exports = router;
