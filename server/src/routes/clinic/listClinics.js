// Already under '/clinics'
// Use filtering parameters that are in the link, i.e. like '.../clinics?example=info' 


// Used to pass build checks, replace below
const express = require("express");
const router = express.Router();
const User = require("../../models/User");

router.get("/", async (req, res) => {
    try{
        console.log("1. Incoming Payload: ", req.body);
        const {auth0Id} = req.body;

        //Validation
        if (!auth0Id) {
            console.log("Fail: Missing auth0Id");
            return res.status(400).json({ error: "Missing required field" });
        }
        //check if user is a staff 
        const user = await Staff.findOne({ auth0Id });
        if (!user) {
            console.log("Fail: User not found or is not a staff member");
            return res.status(404).json({ error: "User not found or is not a staff member" });
        }

        //check if user has a clinic assigned
        const clinic = await Clinic.findOne({ staff: auth0Id });
        if (!clinic) {
            console.log("Fail: No clinic assigned to this staff member");
            return res.status(404).json({ error: "No clinic assigned to this staff member" });
        }

        console.log("2. Validation Passed");
        const clinics = await Clinic.find({ staff: req.body.auth0Id });
        res.status(201).json( clinics );
    }
    catch (error) {
        console.error("Error fetching clinics: ", error);
        res.status(500).json({ message: "Server error" });
    }
    
});
module.exports = router;
