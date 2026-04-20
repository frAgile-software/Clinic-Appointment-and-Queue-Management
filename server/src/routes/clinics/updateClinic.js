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

        // if ID is missing then it should fail anyways

        // Check if clinic exists and update
        const updatedClinic = await Clinic.findByIdAndUpdate(
            id, 
            updateData, 

        );
        if (!updatedClinic) {
            console.log("Fail: Clinic not found");
            return res.status(404).json({ message: "Clinic not found" });
        }
        console.log("2. Clinic Updated Successfully");
        res.status(200).json({ message: "Clinic updated successfully", clinic: updatedClinic });
    } catch (error) {
        console.error("Error updating clinic:", error);
        res.status(500).json({ message: "Server error" });
    }
});
module.exports = router;
