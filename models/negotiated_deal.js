const mongoose = require('mongoose');

const negotiated_dealSchema = new mongoose.Schema({
    company_code: {
        type: String
    },
    company_name: {
        type: String
    },
    customer_account_no: {
        type: String
    },
    negotiated_rate: {
        type: Number
    },
    trade_day: {
        type: Number
    },
    trade_month: {
        type: Number
    },
    trade_year: {
        type: Number
    },
    stock_symbol: {
        type: String
    },
    deal_type: {
        type: String
    },
    active: {
        type: Number
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('negotiated_deal', negotiated_dealSchema);