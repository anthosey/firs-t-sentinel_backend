// const Double = require('@mongoosejs/double');
const mongoose = require('mongoose');


const vatSchema = new mongoose.Schema({
    trx_id: {
        type: String
    },
    transaction_ref: {
        type: String
    },
    cac_id: {
        type: String
    },
    
    transaction_type: {
        type: String
    },

    trade_type: {
        type: String
    },

    tin: {
        type: String
    },

    
    agent_tin: {
        type: String
    },

    beneficiary_tin: {
        type: String
    },

    currency: {
        type: Number
    },
    transaction_amount: {
        type: Number
    },

    vat: {
        type: Number
    },

    base_amount: {
        type: Number
    },
    total_amount: {
        type: Number
    },

    lower_vat: {
        type: Number
    },
    
    upper_vat: {
        type: Number
    },

    total_amount_lower: {
        type: Number
    },

    total_amount_upper: {
        type: Number
    },
    
    other_taxes: {
        type: Number
    },

    company_name: {
        type: String
    },

    company_code: {
        type: String
    },

    sector: {
        type: String
    },

    sub_sector: {
        type: String
    }

}, { timestamps: true }
);

module.exports = mongoose.model('vat', vatSchema);