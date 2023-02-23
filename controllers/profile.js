const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/company');

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


exports.addCompany = (req, res, next) => {
    
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
    const company_name = req.body.company_name;
    const company_address = req.body.company_address;
    const firs_id = req.body.firs_id;
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
    
    
            const company = new Company({
                cac_id: cac_id,
                company_name: company_name,
                company_address: company_address,
                firs_id: firs_id,
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
                extra_note: extra_note            
                
            });
            
            company.save()
            
            .then (record =>{
                console.log('record::' + record);
                res.status(201).json({
                    message: 'account created successfully',
                    data: {cac_id: cac_id,
                        company_name: company_name,
                        company_address: company_address,
                        firs_id: firs_id,
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
                        extra_note: extra_note       }
                })
        
            })
            .catch(err => {
                if (!err.statusCode) {
                    err.statusCode = 500;
                }
                next(err); // pass the error to the next error handling function
            });
           
        
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
    const firs_id = req.body.firs_id;
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
    
    Company.findOne({cac_id: cac_id})
    .then(coyFound =>{
        coyFound.cac_id = cac_id;
        coyFound.company_name = company_name;
        coyFound.company_address = company_address;
        coyFound.firs_id = firs_id;
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

    Company.findOneAndDelete({cac_id: cac_id})
    .then(coys => {
    
        console.log('Deleted: ' + JSON.stringify(coys));
        res.status(200).json({message: 'Company deleted successfully!'});
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
        }
        next(err); // pass the error to the next error handling function
    })
    
}