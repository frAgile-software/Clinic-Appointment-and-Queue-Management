const express = require("express");
const router = express.Router();
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

router.get("/", async (req, res) => {
    try{
        console.log("1. Incoming Payload: ", req.query);
        const {auth0Id} = req.query;
        //If no auth0Id, return error
        if (!auth0Id) {
                console.log("Fail: Missing auth0Id");
                return res.status(400).json({ error: "Missing required field" });
            }
        //Ensure user is staff
        const user = await User.findOne({ auth0Id: auth0Id });
            if (!user || user.role !== "staff") return res.status(404).json({ error: "User not found or is not staff" });
        //find clinic 
        const staff = await Staff.findOne({ User: user._id });
        //No clinic
        if (!staff) return res.status(200).json(null);
        else {  //Clinic found
            const clinic = await Clinic.findById(staff.Clinic);
            return res.status(200).json(clinic);
        }
    }
    catch (error) {
        console.error("Error fetching clinic: ", error);
        res.status(500).json({ message: "Server error" });
    }


});