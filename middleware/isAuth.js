const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not authenticated');
        error.statusCode = 401;
        throw error;
    }
    console.log('authHeader: ' + authHeader);
    const token = req.get('Authorization').split(' ')[1]; // slit by space after Bearer and pick the next value as token
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.KOKORO_IWOLE);
    } catch (err) {
        console.log('Yap:' + err.message);
        if (err.message === 'jwt malformed') {
            err.message = 'Not Authenticated.';
        }

        if (err.message === 'jwt expired') {
            err.message = 'Login expired.';
        }

        err.statusCode = 500;
        throw err;
    }
    if (!decodedToken) {
        const error = new Error('Not authenticated.');
        error.statusCode = 401;
        throw error;
    }
    
    req.userId = decodedToken.email; // store userId from a decoded token in the request so, it may be accessible from other places
    next(); //call the next function so that the operation does not get stuck at this middleware
}
