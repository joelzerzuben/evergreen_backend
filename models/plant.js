const mongoose = require('mongoose');

const plantSchema = new mongoose.Schema({
    name: String,
    bild: String,
    kategorie: String,
    boden: String,
    wasser_min: Number,
    wasser_max: Number,
    licht_min: Number,
    licht_max: Number,
    temperatur_min: Number,
    temperatur_max: Number,
    updated_at : Date 
    
},
{ collection : 'plants' }
)


module.exports = mongoose.model('plants', plantSchema)