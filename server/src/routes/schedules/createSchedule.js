const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

// POST /api/schedules/bulk
// Sends the default schedule for a new staff member across all 7 days to the database 
router.post("/bulk", async (req, res) => {
    try {
        const { staffId, schedules } = req.body;

        if (!staffId)
            return res.status(400).json({ message: "staffId is required." });

        if (!Array.isArray(schedules) || schedules.length === 0)
            return res.status(400).json({ message: "schedules array is required." });

        const staffUser = await User.findOne({ auth0Id: staffId });
        if (!staffUser)
            return res.status(404).json({ message: "Staff member not found." });

        const created = await Schedule.insertMany(
            schedules.map(({ DayOfWeek, StartTime, EndTime }) => ({
                Staff: staffUser._id,
                DayOfWeek,
                StartTime,
                EndTime,
            }))
        );

        res.status(201).json({ message: "Default schedule created.", schedules: created });

    } catch (error) {
        console.error("Error creating bulk schedule:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;