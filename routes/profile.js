const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profile');
// const Client = require('../models/client');
const Company = require('../models/company');
const Personal = require('../models/personal');


// const isAuth = require('../middleware/isAuth');

// router.get('/drivers', isAuth, userController.getDrivers);
router.get('/companies', profileController.getCompanies);
router.get('/onecompany/:cac_id', profileController.getOneCompany);

// router.get('/countrycode/:code', userController.getCountryCodes);
router.post('/addcompany', [
    body('cac_id')
    .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID can not be empty')
        .custom((value, { req }) => {
            return Company.findOne({cac_id: value}).then(foundDoc =>{
                if (foundDoc) {
                    console.log('Yes cac id found' + foundDoc);
                    return Promise.reject('This CAC registration ID already exists');
                }
            });
        }),

        body('firs_id')
        .trim()
            .not()
            .isEmpty()
            .withMessage('CAC FIRS ID can not be empty')
            .custom((value, { req }) => {
                return Company.findOne({firs_id: value}).then(foundDoc =>{
                    if (foundDoc) {
                        console.log('Yes firs id found' + foundDoc);
                        return Promise.reject('This FIRS ID already exists');
                    }
                });
            }),

            body('company_name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Company\'s name can not be empty'),

            body('sector')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Sector of operation is compulsory'),

                body('email')
                .isEmail()
                .withMessage('Please enter a valid email.')
                .custom((value, { req }) => {
                    return Company.findOne({email: value}).then(foundDoc => {
                        if (foundDoc) {
                            console.log('Yes it is Em' + foundDoc);
                            return Promise.reject('E-mail address already exists');
                        }
                    });
                })
        .normalizeEmail()

], profileController.addCompany);


router.post('/updatecompany', [
                body('cac_id')
                .trim()
                    .not()
                    .isEmpty()
                    .withMessage('CAC registration ID can not be empty'),

                    body('firs_id')
                    .trim()
                        .not()
                        .isEmpty()
                        .withMessage('CAC FIRS ID can not be empty'),
    
                body('company_name')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('Company\'s name can not be empty'),

                body('sub_sector')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('Sub sector of operation is compulsory'),

                body('sector')
                    .trim()
                    .not()
                    .isEmpty()
                    .withMessage('Sector of operation is compulsory'),

                
                    body('email')
                    .isEmail()
                    .withMessage('Please enter a valid email.')
                    .normalizeEmail()

], profileController.updateCompany);

router.post('/deletecompany', [
    body('cac_id')
        .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID is required')

], profileController.deleteCompany);

// router.post('/deletecompany', [
//         body('cac_id')
//         .trim()
//         .not()
//         .isEmpty()
//         .withMessage('CAC registration ID can not be empty'),

            
//     ], profileController.deleteCompany);


// ****PERSONAL RECORDS*******
router.post('/addindividual', [
    body('user_id')
    .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID can not be empty')
        .custom((value, { req }) => {
            return Company.findOne({cac_id: value}).then(foundDoc =>{
                if (foundDoc) {
                    console.log('Yes cac id found' + foundDoc);
                    return Promise.reject('This CAC registration ID already exists');
                }
            });
        }),

        body('firs_id')
        .trim()
            .not()
            .isEmpty()
            .withMessage('CAC FIRS ID can not be empty')
            .custom((value, { req }) => {
                return Company.findOne({firs_id: value}).then(foundDoc =>{
                    if (foundDoc) {
                        console.log('Yes firs id found' + foundDoc);
                        return Promise.reject('This FIRS ID already exists');
                    }
                });
            }),

            body('company_name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Company\'s name can not be empty'),

            body('sector')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Sector of operation is compulsory'),

                body('email')
                .isEmail()
                .withMessage('Please enter a valid email.')
                .custom((value, { req }) => {
                    return Company.findOne({email: value}).then(foundDoc => {
                        if (foundDoc) {
                            console.log('Yes it is Em' + foundDoc);
                            return Promise.reject('E-mail address already exists');
                        }
                    });
                })
        .normalizeEmail()

], profileController.addCompany);


module.exports = router;