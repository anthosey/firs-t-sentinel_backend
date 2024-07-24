const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    firstname: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    
    usertype: {
        type: String
    },

    accountActivationToken: {
        type: String
    },
    passwordResetToken: {
        type: String
    },
    passwordResetTokenExpiy: {
        type: Date
    },
    mobileConfirmed: {
        type: String
    },
    emailConfirmed: {
        type: String
    },
    status:{
        type: String,
        required: true
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('user', userSchema);