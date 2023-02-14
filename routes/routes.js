
const express = require('express');
const plantModel = require('../models/plant');
const userModel = require('../models/user');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const auth = require("../middleware/auth");
const mongoose = require('mongoose');
router.use(bodyParser.urlencoded({ extended: true })); // xx-url-encoded POST body


// -- PFLANZEN LEXIKON -- //

//GET ONE by ID
router.get('/plant/get', async (req, res) => {

    try{
        queryParams = req.query;
        let id = queryParams.id ?? '';
        const data = await plantModel.findOne({"_id" : id });
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

//GET ALL Method
router.get('/plant/getAll', async (req, res) => {

    try{
        const data = await plantModel.find().sort({name : 1});
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})

//SEARCH PLANTS
/** 
 * name
 * kategorie
 * 
*/
router.get('/plant/search', async (req, res) => {
    try{
        queryParams = req.query;
        //searchable parameters
        let name = queryParams.name ?? '';
        let kategorie = queryParams.kategorie ?? ''

        const data = await plantModel.find({ $and : [ {"name":{ $regex: '.*'+name+'.*'}}, {"kategorie":{ $regex: '.*'+kategorie+'.*'}}]}).sort({"kategorie" : 1, name : 1});
        res.json(data)
    }
    catch(error){
        res.status(500).json({message: error.message})
    }
})
// -- PFLANZEN LEXIKON END -- //




// -- USER  -- //

router.post("/user/login", async (req, res) => {
    let data = {
        username: req.body.username,
        password_hash: req.body.password
    }

    // Check Credentials
    const userData = await userModel.findOne({ $and : [ {"username" : data.username }, {"password" : data.password_hash} ] });
    if(userData == null){
        res.json({"token" : "", "valid" : false});
        console.log("invalid username/password")
        return;
    }

    // generate JWT Token
    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(data, jwtSecretKey,{ expiresIn: `${process.env.JWT_LIFESPAN_HOURS}h` });
    res.send({"token" : token, "valid" : true});
});



// Registering a new user
router.post("/user/register", async (req, res) => {
    
    // Validate Form Data
    if( !req.body.username || !req.body.password_hash ){
        res.status(200).send("Invalid Form Data");
        return;
    }

    // Check if username exists
    const userData = await userModel.findOne( {"username" : req.body.username  });
    if(userData){
        res.json({"msg" : "Dieser Benutzer existiert bereits", "valid" : false});
        return;
    }
  
    //Save User --> user gets an Auth token to save
    const newUser = await userModel.create({
        username : req.body.username,
        password : req.body.password_hash,
        plants : []
    });

    let data = {
        username: req.body.username,
        password_hash: req.body.password_hash
    }

    let jwtSecretKey = process.env.JWT_SECRET_KEY;
    const token = jwt.sign(data, jwtSecretKey,{ expiresIn: `${process.env.JWT_LIFESPAN_HOURS}h` });

    res.json({"token" : token, "valid" : true});
});

//Get UserData
router.get("/user/get", auth, async (req, res) => {
    const userData = await userModel.findOne({ $and : [ {"username" : req.user.username }, {"password" : req.user.password_hash}] }, {password:0});
    res.status(200).send(userData);
});

//TODO Remove --> example for authenticated stuff
router.post("/user/auth", auth, (req, res) => {
    res.status(200).send("Welcome 🙌 ");
});

// -- USER END -- //













// -- USER PLANTS -- //

//ADD new Plant to user
router.post("/user/plant/create", auth, async (req, res) => {

    if( !req.body.beschreibung || !req.body.name || !req.body.raum || 
        !req.body.kategorie || isNaN(req.body.lichtbedarf_min) || 
        !req.body.wasser_min || !req.body.boden || !req.body.temperatur_min || !req.body.temperatur_max ){
        res.status(200).send({"error" : 1, "msg" : "Invalid form data"});
        return;
    }

    const newPlant = {
        bild : req.body.bild,
        name : req.body.name,
        beschreibung : req.body.beschreibung,
        raum : req.body.raum,
        kategorie : req.body.kategorie,
        lichtbedarf_min : req.body.lichtbedarf_min,
        lichtbedarf_max : req.body.lichtbedarf_max,
        wasser_min : req.body.wasser_min,
        wasser_max : req.body.wasser_max,
        boden : req.body.boden,
        temperatur_min : req.body.temperatur_min,
        temperatur_max : req.body.temperatur_max,
        alive : true,
        waesserungen : [
            new Date()
         ]
    }

    console.log(newPlant)

    await userModel.updateOne(
        { username: req.user.username }, 
        { $push: { plants: newPlant } }
    );

    res.status(200).send({"error" : 0});
});

//Update Plant of user
router.post("/user/plant/update", auth, async (req, res) => {

    if( !req.body._id || !req.body.beschreibung || !req.body.raum || !req.body.alive){
        res.status(200).send("Invalid Form Data");
        return;
    }

    await userModel.updateOne(
        { "plants._id": mongoose.Types.ObjectId(req.body._id) },
        {
            $set: {
                "plants.$.beschreibung": req.body.beschreibung,
                "plants.$.raum": req.body.raum,
                "plants.$.alive": req.body.alive,
                "plants.$.bild" : req.body.bild
             }
        }
    )

    res.status(200).send({"error" : 0});
});

//Pflanze löschen
router.post("/user/plant/delete", auth, async (req, res) => {

    if( !req.body.id){
        res.status(200).send({"error" : 1, "msg" : "invalid Form Data"});
        return;
    }

    await userModel.updateOne({ username: req.user.username }, {
        $pull: {
            "plants": {_id : req.body.id},
        },
    });

    res.status(200).send({"error" : 0});
});

//Add Wasserung
router.post("/user/plant/water/add", auth, async (req, res) => {

    if( !req.body._id){
        res.status(200).send("Invalid Form Data");
        return;
    }


    await userModel.updateOne(
        { "plants._id": req.body._id }, 
        { $push: { "plants.$.waesserungen": req.body.time ?? new Date() } }
    );

    res.status(200).send({"error" : 0});
});

//DELETE Wasserung
router.post("/user/plant/water/delete", auth, async (req, res) => {

    if( !req.body._id){
        res.status(200).send("Invalid Form Data");
        return;
    }

    await userModel.updateOne(
        { "plants._id": req.body._id,  }, 
        { $pull: { "plants.$.waesserungen": req.body.time} }
    );

    res.status(200).send({"error" : 0});
});


// -- USER PLANTS END -- //

module.exports = router;