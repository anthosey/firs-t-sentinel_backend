const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const profileController = require('../controllers/profile');
// const Client = require('../models/client');
const Company = require('../models/company');
const Personal = require('../models/personal');
const NegotiatedDeal = require('../models/negotiated_deal');


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

        body('tin')
        .trim()
            .not()
            .isEmpty()
            .withMessage('TIN can not be empty')
            .custom((value, { req }) => {
                return Company.findOne({tin: value}).then(foundDoc =>{
                    if (foundDoc) {
                        console.log('Yes TIN found' + foundDoc);
                        return Promise.reject('This TIN already exists');
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


router.post('/addcompanywithimage', [
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

        body('tin')
        .trim()
            .not()
            .isEmpty()
            .withMessage('TIN can not be empty')
            .custom((value, { req }) => {
                return Company.findOne({tin: value}).then(foundDoc =>{
                    if (foundDoc) {
                        console.log('Yes TIN found' + foundDoc);
                        return Promise.reject('This TIN already exists');
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

], profileController.addCompanyWithImagefile);



router.post('/updatecompany', [
                body('cac_id')
                .trim()
                    .not()
                    .isEmpty()
                    .withMessage('CAC registration ID can not be empty'),

                    body('tin')
                    .trim()
                        .not()
                        .isEmpty()
                        .withMessage('TIN can not be empty'),
    
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


router.post('/updateverifiedtin', [
    body('cac_id')
    .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID can not be empty'),

        body('tin')
        .trim()
            .not()
            .isEmpty()
            .withMessage('TIN can not be empty'),

    body('taxpayer_name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Provide Taxpayer\'s name'),

    body('tax_office_id')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Tax office id is compulsory'),

    body('tax_office_address')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Tax office address is compulsory'),

    

], profileController.updateTinVerification);

router.post('/deletecompany', [
    body('cac_id')
        .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID is required')

], profileController.deleteCompany);

router.post('/forcedeletecompany', [
    body('cac_id')
        .trim()
        .not()
        .isEmpty()
        .withMessage('CAC registration ID is required')

], profileController.deleteCompanyWithTransactions);


// NEGOTIATED DEALS REGISTER
router.post('/addnegotiateddeal', [
    body('company_code')
    .trim()
        .not()
        .isEmpty()
        .withMessage('company code can not be empty'),

        body('company_name')
        .trim()
            .not()
            .isEmpty()
            .withMessage('Company name can not be empty'),

            body('customer_account_no')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Provide the customers account number'),

            body('negotiated_rate')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Negotiated rate is compulsory')
], profileController.addNegotiatedDeal);


// ****PERSONAL RECORDS*******
router.post('/addindividual', [
  
            body('name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Name can not be empty'),

            body('mobile')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Mobile can not be empty'),
            
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

], profileController.addIndividual);

router.post('/updateindividual', [
    body('name')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Name can not be empty'),

            body('mobile')
                .trim()
                .not()
                .isEmpty()
                .withMessage('Mobile can not be empty'),
            
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

], profileController.updateIndividual);

router.post('/deleteindividual', [
    body('email')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Email is required')

], profileController.deleteIndividual);

router.get('/individuals', profileController.getIndividuals);
router.get('/oneindividual/:email', profileController.getOneIndividual);

module.exports = router;