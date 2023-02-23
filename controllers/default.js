// const User = require('../models/client');
// const Driver = require('../models/driver');
const User = require('../models/user');

exports.getTest = (req, res, next) => {
    console.log('True, Im working...');
        res.status(200).json({message: 'api working...'});   
}


exports.getTestDb = (req, res, next) => {
    console.log('Yesp, I got here too');
    User.findOne({email: 'anthosey@gmail.com'})
    .then(user => {
        if (!user) {
            const error = new Error('User not found!.');
            error.statusCode = 422;
            throw error;
        }
        res.status(200).json({message: 'Db working...', user: user});   
    })
    .catch(err => {
        if (!err.statusCode) {
            err.statusCode = 500;
            }
            next(err); 
    })
    
}

exports.getUser = (req, res, next) => { 
    // console.log('Filter:: ' + tempFilter);
        User.find()
        .then(users => {
            res.status(200).json({message: 'success', data: users});
        })
        .catch(err => {
            if (!err.statusCode) {
                err.statusCode = 500;
            }
            next(err); // pass the error to the next error handling function
        })    
             
}