const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

// POST /api/schedules
// Adds a new schedule block when staff checks a slot back on
// Body: { staffId, DayOfWeek, StartTime, EndTime }
// Note: staffId is the Auth0 ID (e.g. "auth0|xxx"), not a MongoDB ObjectId
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

        // Look up by Auth0 ID, not MongoDB _id
        const staffUser = await User.findOne({ auth0Id: staffId });
        if (!staffUser) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        // Prevent duplicate blocks for the same staff/day/time
        const existing = await Schedule.findOne({
            Staff: staffUser._id,
            DayOfWeek,
            StartTime,
            EndTime,
        });
        if (existing) {
            return res.status(409).json({ message: "Schedule block already exists.", schedule: existing });
        }

        const newBlock = await Schedule.create({
            Staff: staffUser._id,
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