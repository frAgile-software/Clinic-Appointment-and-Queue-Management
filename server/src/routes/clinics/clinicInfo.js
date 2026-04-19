// Already under '/clinics'
// Use '/:clinicID' or similar
// For patients to use

// Used to pass build checks, replace below
const express = require("express");
const router = express.Router();

// GET /clinics/:id
// Fetches one clinic entry from the database using its ObjectId.
router.get("/:id", async (req, res) => {
    try {
        console.log("1. Incoming request params:", req.params);
 
        const { id } = req.params;
 
        // Validation
        // Reject immediately if no ID was provided in the URL segment.
        if (!id) {
            console.log("Fail: Missing clinic ID");
            return res.status(400).json({ error: "Missing required field: id" });
        }
 
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