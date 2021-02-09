const mongoose = require('mongoose');

const memeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    caption: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true                      
    },

    time: {
        type: Date,
        default: Date.now
    },

    like: {
        type: Number,
        default: 0
    }
})

const Meme = mongoose.model('Meme', memeSchema);

module.exports = Meme;