const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

router.post("/", async (req, res) => {
    try {
        const { staffId, DayOfWeek, StartTime, EndTime } = req.body;

        if (!staffId) {
            return res.status(400).json({ message: "staffId is required." });
        }
        if (DayOfWeek === undefined || DayOfWeek < 0 || DayOfWeek > 6) {
            return res.status(400).json({ message: "DayOfWeek must be 0–6." });
        }
        if (!StartTime || !EndTime) {
            return res.status(400).json({ message: "StartTime and EndTime are required." });
        }
        if (EndTime <= StartTime) {
            return res.status(400).json({ message: "EndTime must be later than StartTime." });
        }

        const staffUser = await User.findOne({ auth0Id: staffId });
        if (!staffUser) {
            return res.status(404).json({ message: "User not found." });
        }

        const staffRecord = await Staff.findOne({ User: staffUser._id });
        if (!staffRecord) {
            return res.status(404).json({ message: "Staff record not found." });
        }

        const existing = await Schedule.findOne({
            Staff: staffRecord._id,
            DayOfWeek,
            StartTime,
            EndTime,
        });
        if (existing) {
            return res.status(409).json({ message: "Schedule block already exists.", schedule: existing });
        }

        const newBlock = await Schedule.create({
            Staff: staffRecord._id,
            DayOfWeek,
            StartTime,
            EndTime,
        });

        res.status(201).json({ message: "Schedule block created.", schedule: newBlock });
    } catch (error) {
        console.error("Error creating schedule block:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;