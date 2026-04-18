// Already under '/api/clinic'


// Used to pass build checks, replace below
const express = require("express");
const Clinic = require("../../database/models/Clinic");
const router = express.Router();

router.put("/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
         console.log("1. Incoming Payload: ", req.params);
         console.log("2. Update Data: ", updateData);

        //validation
        if (!id) {
            console.log("Fail: Missing clinic ID");
            return res.status(400).json({ message: "Missing clinic ID" });
        }
        console.log("2. Validation Passed");
        // Check if clinic exists and update
        const updatedClinic = await Clinic.findByIdAndUpdate(
            id, 
            updateData, 

        );
        if (!updatedClinic) {
            console.log("Fail: Clinic not found");
            return res.status(404).json({ message: "Clinic not found" });
        }
        console.log("3. Clinic Updated Successfully");
    } catch (error) {
        console.error("Error updating clinic:", error);
        res.status(500).json({ message: "Server error" });
    }
});
module.exports = router;
