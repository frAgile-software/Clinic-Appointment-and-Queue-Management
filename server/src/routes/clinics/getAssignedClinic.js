const express = require("express");
const router = express.Router();
const Clinic = require('../../database/models/Clinic');
const User = require('../../database/models/User');
const Staff = require('../../database/models/Staff');

router.get("/", async (req, res) => {
    try {
        const { auth0Id } = req.query;

        if (!auth0Id) {
            return res.status(400).json({ error: "Missing auth0Id" });
        }

        const user = await User.findOne({ auth0Id });
        if (!user || user.role !== "Staff") {
            return res.status(404).json({ error: "Staff user not found" });
        }

        const staffRecord = await Staff.findOne({ User: user._id });
        if (!staffRecord) {
            return res.status(200).json(null);
        }

        const clinic = await Clinic.findById(staffRecord.Clinic);
        return res.status(200).json(clinic || null);

    } catch (error) {
        console.error("Error in getAssignedClinic:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;