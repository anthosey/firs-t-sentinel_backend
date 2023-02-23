const mongoose = require('mongoose');
const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: Number,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    status:{
        type: String,
        required: true
    },
    contactAddress: {  
        type: String
    },
    wallet: {
        type: Number
    },
    rating: {
        type: Number
    },
    businessType: {
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
    imageUrl: {
        type: String
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('driver', driverSchema);