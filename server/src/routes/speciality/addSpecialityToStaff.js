const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Staff = require("../../database/models/Staff");
const Speciality = require("../../database/models/Speciality");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

router.post("/staff/:staffId/:specialityId", async (req,res) => {
    try {
        const { staffId, specialityId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ message: "Invalid staff ID." });
        }

        if (!mongoose.Types.ObjectId.isValid(specialityId)) {
            return res.status(400).json({ message: "Invalid speciality ID." });
        }

        const staff = await Staff.findById(staffId);
        if (!staff) {
            return res.status(404).json({ message: "Staff not found." });
        }

        const speciality = await Speciality.findById(specialityId);
        if (!speciality) {
            return res.status(404).json({ message: "Speciality not found." });
        }

        const existingLink = await StaffSpeciality.findOne({
            Staff: staffId,
            Speciality: specialityId
        });

        if (existingLink) {
            return res.status(409).json({ message: "Staff already has this speciality." });
        }

        const staffSpeciality = await StaffSpeciality.create({
            Staff: staffId,
            Speciality: specialityId
        });

        res.status(201).json({
            message: "Speciality added to staff successfully.",
            staffSpeciality
        });
    } catch (error) {
        console.error("Error adding speciality to staff:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;