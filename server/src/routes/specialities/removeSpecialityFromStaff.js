const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const StaffSpeciality = require("../../database/models/StaffSpeciality");

router.delete("/staff/:staffId/:specialityId", async (req, res) => {
    try {
        const { staffId, specialityId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ message: "Invalid staff ID." });
        }

        if (!mongoose.Types.ObjectId.isValid(specialityId)) {
            return res.status(400).json({ message: "Invalid speciality ID." });
        }

        const deletedLink = await StaffSpeciality.findOneAndDelete({
            Staff: staffId,
            Speciality: specialityId
        });

        if (!deletedLink) {
            return res.status(404).json({ message: "Staff speciality link not found." });
        }

        res.status(200).json({
            message: "Speciality removed from staff successfully.",
            staffSpeciality: deletedLink
        });
    } catch (error) {
        console.error("Error removing speciality from staff:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;