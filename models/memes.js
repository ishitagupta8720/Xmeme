const mongoose = require('mongoose');

//This is the schema of a meme
//It contains a name, caption and url to be entered and the time and likes input are given a default value
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