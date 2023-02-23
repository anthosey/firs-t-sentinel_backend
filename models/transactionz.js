const mongoose = require('mongoose');
const transactionzSchema = new mongoose.Schema({
    trx_id: {
        type: String,
        required: true,
        unique: true
    },
    cac_id: {
        type: String
    },
    personal_id: {
        type: String
    },
    user_id: {
        type: String
    },
    company_name: {
        type: String
        // required: true
    },
    sector: {
        type: String,
        required: true
    },
    sub_sector: {
        type: String,
        required: true
    },
    trx_type: {
        type: String,
        required: true
    },
    trx_value: {
        type: Number,
        required: true
    },
    vat: {
        type: Number,
        required: true
    },
    remarks: {
        type: String
    },
    
    
}, { timestamps: true }
);

module.exports = mongoose.model('transactionz', transactionzSchema);