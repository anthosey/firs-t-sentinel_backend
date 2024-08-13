const mongoose = require('mongoose');

const ngxdataSchema = new mongoose.Schema({
    trade_date: {
        type: String
    },
    trade_no: {
        type: String
    },
    board: {
        type: String
    },
    security: {
        type: String
    },
    trade_time: {
        type: Date
        // required: true
    },
    price: {
        type: Number
    },
    qty: {
        type: Number
    },
    value: {
        type: Number
    },
    settlement_value_value: {
        type: Number
    },
    buy_firm_code: {
        type: String
    },
    
    buy_firm_name: {
        type: String
    },

    sell_firm_name: {
        type: String
    },
    
    sell_firm_code: {
        type: String
    },
    
    buy_trading_account: {
        type: String
    },

    sell_trading_account: {
        type: String
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('ngxdata', ngxdataSchema);