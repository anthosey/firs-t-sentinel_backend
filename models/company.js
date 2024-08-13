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
    tin: {
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
    },

    company_code: {
        type: String
    },

    postal_address: {
        type: String
    },

    corporate_website: {
        type: String
    },
    taxpayer_name: {
        type: String
    },
    taxpayer_address: {
        type:String
    },
    taxpayer_type: {
        type: String
    },
    taxpayer_rc: {
        type: String
    },
    taxpayer_email: {
        type: String
    },
    taxpayer_Phone: {
        type: String
    },
    tax_office_id: {
        type: String
    },
    tax_office_name: {
        type: String
    },
    jtbtin:{
        type: String
    },
   region: {
    type: String
   },
   state: {
    type: String
   },
   trans_threshold:{
    type: String
   },
    tin_verified: {
        type: Number
    },
    operating_licence_type: {
        type: String
    },
    proprietary_account: {
        type: String
    }

    
}, { timestamps: true }
);

module.exports = mongoose.model('company', companySchema);