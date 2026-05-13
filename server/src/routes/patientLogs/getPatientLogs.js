const express = require("express");
const router = express.Router();
const PatientLog = require("../../database/models/PatientLog");
const User = require("../../database/models/User");

router.get("/:auth0Id", async (req, res) => {
    try {
        const { auth0Id } = req.params;
        
        const user = await User.findOne({ auth0Id });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const logs = await PatientLog.find({ Patient: user._id })
            .populate("Speciality", "SpecialityName")
            .populate("Staff", "name surname")
            .sort({ TimeIn: -1 }); // Sort by newest first

        res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching patient logs:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;