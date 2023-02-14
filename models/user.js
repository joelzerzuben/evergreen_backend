const mongoose = require('mongoose');

// Changes also in Frontend
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    plants : [{
        name : String,
        bild : String,
        beschreibung : String,
        raum : String,
        kategorie : String,
        lichtbedarf_min :  Number,
        lichtbedarf_max : Number,
        wasser_min : Number,
        wasser_max : Number,
        boden : String,
        temperatur_min : Number,
        temperatur_max : Number,
        alive : Boolean,
        waesserungen : [Date]
    }]
    
},
{ collection : 'users' }
)

module.exports = mongoose.model('users', userSchema)