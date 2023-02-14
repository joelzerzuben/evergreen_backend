require('dotenv').config();
const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const mongoString = process.env.DATABASE;

//Datenbank
mongoose.connect(mongoString);
const database = mongoose.connection;
database.on('error', (error) => {
    console.log(error)
});
database.once('connected', () => {
    console.log('Database Connected');
});

// Express
const app = express();
app.use(cors({
    origin: '*'
}));
app.use(express.json());

//Routing
const routes = require('./routes/routes');
app.use('/api', routes)

//Server
app.listen(3000, () => {
    console.log(`Server Started at ${3000}`)
})