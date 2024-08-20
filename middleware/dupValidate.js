const Company = require('../models/company');
module.exports = (req, res, next) => {
    const email = req.body.email;
    const cac = req.get('cac_id');
    
    console.log('cac ID ' + cac);
    Company.findOne({cac_id: cac})
    
    .then(data => {
        if (data) {
            console.log('REcord found!' + data)
            return Promise.reject('Email already exists');

            // const error = new Error('Email already exists');
            //         error.statusCode = 401;
            //         throw error;
        }
    })

//     if (!authHeader) {
//         const error = new Error('Not authenticated');
//         error.statusCode = 401;
//         throw error;
//     }
//     console.log('authHeader: ' + authHeader);
//     const token = req.get('Authorization').split(' ')[1]; // slit by space after Bearer and pick the next value as token
//     let decodedToken;
//     try {
//         decodedToken = jwt.verify(token, process.env.KOKORO_IWOLE);
//     } catch (err) {
//         console.log('Yap:' + err.message);
//         if (err.message === 'jwt malformed') {
//             err.message = 'Not Authenticated.';
//         }

//         if (err.message === 'jwt expired') {
//             err.message = 'Login expired.';
//         }

//         err.statusCode = 500;
//         throw err;
//     }
//     if (!decodedToken) {
//         const error = new Error('Not authenticated.');
//         error.statusCode = 401;
//         throw error;
//     }
    
//     req.userId = decodedToken.email; // store userId from a decoded token in the request so, it may be accessible from other places
    next(); //call the next function so that the operation does not get stuck at this middleware
}
