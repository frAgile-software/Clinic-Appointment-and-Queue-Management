
const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

// GET /api/schedules/:userId
router.get("/:userId", async (req, res) => {
    try {
        const userId = decodeURIComponent(req.params.userId);
        console.log("1. userId:", userId);

        const user = await User.findOne({ auth0Id: userId });
        console.log("2. user:", user?._id);

        const staffRecord = await Staff.findOne({ User: user._id });
        console.log("3. staffRecord:", staffRecord?._id);

        const schedule = await Schedule.find({ Staff: staffRecord._id })
            .sort({ DayOfWeek: 1, StartTime: 1 });
        console.log("4. schedule count:", schedule.length);

        res.status(200).json({ schedule });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ message: "Server error." });
    }
});
module.exports = router;