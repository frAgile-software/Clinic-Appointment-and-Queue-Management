const express = require("express");
const Clinic = require("../../database/models/Clinic");
const User = require("../../database/models/User"); 
const Staff = require("../../database/models/Staff");
const router = express.Router();

router.get("/", async (req, res) => {
    try{
        console.log("1. Incoming Payload: ", req.query);
        const {auth0Id} = req.query;

        //Validation
        if (!auth0Id) {
            console.log("Fail: Missing auth0Id");
            return res.status(400).json({ error: "Missing required field" });
        }
        //check if user is a staff 
        //find user
        const user = await User.findOne({ auth0Id: auth0Id });
        if (!user) return res.status(404).json({ error: "User not found" });

        //check if user is staff
        const staffRecords = await Staff.find({ User: user._id });
        if (!staffRecords || staffRecords.length === 0) {
            console.log("Fail: User is not a staff member");
            return res.status(404).json({ error: "User is not a staff member" });
        }
        
        //check if user has a clinic assigned
        const clinicIds = staffRecords.map(record => record.Clinic);
        const clinics = await Clinic.find({ _id: { $in: clinicIds } });

        if (!clinics || clinics.length === 0) {
            console.log("Fail: No clinic assigned to this staff member");
            return res.status(404).json({ error: "No clinic assigned to this staff member" });
        }

        console.log("2. Validation Passed");
        
        res.status(200).json( clinics );
    }
    catch (error) {
        console.error("Error fetching clinics: ", error);
        res.status(500).json({ message: "Server error" });
    }
    
});
module.exports = router;