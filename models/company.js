const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    cac_id: {
        type: String,
        required: true,
        unique: true
    },
    company_name: {
        type: String,
        required: true
    },
    company_address: {
        type: String
        // required: true
    },
    firs_id: {
        type: String,
        required: true,
        unique: true
    },
    sector: {
        type: String,
        required: true
    },
    sub_sector: {
        type: String
        // required: true
    },
    company_head: {
        type: String
    },
    email: {
        type: String
        // required: true
    },
    phone: {
        type: String,
        required: true
    },
    mobile: {
        type: String
        // required: true
    },
    image_url: {
        type: String
        // required: true
    },
    incorporation_date: {
        type: Date
        // required: true
    },

    established_date: {
        type: Date
        // required: true
    },

    brief_history: {
        type: String
    },
    extra_note: {
        type: String
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('company', companySchema);