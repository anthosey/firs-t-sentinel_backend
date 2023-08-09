// const Double = require('@mongoosejs/double');
const mongoose = require('mongoose');


const transactionzSchema = new mongoose.Schema({
    trx_id: {
        type: String,
        required: true,
        unique: true
    },
    trx_ref_provider: {
        type: String
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
        type: String
    },
    trx_type: {
        type: String,
        required: true
    },
    trx_value: {
        type: Number
    },
    vat: {
        type: Number
    },
    
    remarks: {
        type: String
    },

    transaction_ref: {
        type: String
    },
    
    tin: {
        type: String
    },
    
    company_code: {
        type: String
    },

    trade_type: {
        type: String
    },

    cscs_number: {
        type: String
    },

    beneficiary_name: {
        type: String
    },

    stock_symbol: {
        type: String
    },

    volume: {
        type: Number
    },

    unit_price: {
        type: Number
    },

    counter_party_code: {
        type: String
    },
    counter_party_name: {
        type: String
    },

    provider_code: {
        type: String
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('transactionz', transactionzSchema);