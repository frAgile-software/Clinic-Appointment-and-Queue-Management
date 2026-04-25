const express = require("express");
const router = express.Router();
const Clinic = require("../../database/models/Clinic");

// GET /clinics/:id
// Fetches one clinic entry from the database using its ObjectId.
router.get("/:id", async (req, res) => {
    try {
        console.log("1. Incoming request params:", req.params);
 
        const { id } = req.params;
 
        // Database lookup 
        const clinic = await Clinic.findById(id);
 
        //No document matched the given ID.
        if (!clinic) {
            console.log("Fail: Clinic not found for id:", id);
            return res.status(404).json({ error: "Clinic not found" });
        }
 
        console.log("2. Clinic found:", clinic.practiceName);
 
        res.status(200).json(clinic);
 
    } catch (error) {
     
        if (error.name === "CastError") {
            console.error("Invalid ObjectId format:", req.params.id);
            return res.status(400).json({ error: "Invalid clinic ID format" });
        }
 
        console.error("Error fetching clinic info:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;