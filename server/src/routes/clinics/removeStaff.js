const express= require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Staff = require("../../database/models/Staff");


router.delete("/:clinicID/staff/:staffID", async (req, res) => {
    try{
        const { clinicID, staffID } = req.params;
        if(!mongoose.Types.ObjectId.isValid(clinicID))
        {
            return res.status(400).json({ message: "Invalid clinic ID" });
        }
        if(!mongoose.Types.ObjectId.isValid(staffID))
        {
            return res.status(400).json({ message: "Invalid staff ID" });
        }
        const staff = await Staff.findById(staffID);
        if(!staff)
        {
            return res.status(404).json({ message: "Staff not found" });
        }
        if(staff.Clinic.toString() !== clinicID)
        {
            return res.status(403).json({ message: "Staff does not belong to the specified clinic" });
        }
        await Staff.findByIdAndDelete(staffID);
        res.status(200).json({ message: "Staff member removed successfully", staffID });
    } catch (error) {
        console.error("Error removing staff:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
