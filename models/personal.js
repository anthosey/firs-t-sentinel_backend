const mongoose = require('mongoose');
const personalSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    company: {
        type: String
    },
    position: {
        type: String
    },
    office_address: {
        type: String
        // required: true
    },
    brief_history: {
        type: String
    },
    extra_note: {
        type: String
    },
    image_url: {
        type: String
    }
    
}, { timestamps: true }
);

module.exports = mongoose.model('personal', personalSchema);