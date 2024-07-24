const mongoose = require('mongoose');
const tlogsSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    name: {
        type: String
    },
    action: {
        type: String
    }
     
}, { timestamps: true }
);

module.exports = mongoose.model('tlogs', tlogsSchema);