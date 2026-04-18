// Already under '/clinics'
// Use filtering parameters that are in the link, i.e. like '.../clinics?example=info' 


const express = require("express");
const Clinic = require("../../database/models/Clinic");
const router = express.Router();

router.get("/:id", async (req, res) => {
    try{
        console.log("1. Incoming Payload: ", req.params);
        const {id} = req.params;

        //Validation
        if (!id) {
            console.log("Fail: Missing clinic ID");
            return res.status(400).json({ error: "Missing required field" });
        }
        //find clinic
        const clinic = await Clinic.findById(id);
        if (!clinic) {
            console.log("Fail: Clinic not found");
            return res.status(404).json({ error: "Clinic not found" });
        }
        console.log("2. Validation Passed");
        res.status(200).json(clinic);
    }
    catch (error) {
        console.error("Error fetching clinics: ", error);
        res.status(500).json({ message: "Server error" });
    }
    
});
module.exports = router;    