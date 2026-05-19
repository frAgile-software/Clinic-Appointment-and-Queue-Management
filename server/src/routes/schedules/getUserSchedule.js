const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

// GET /api/schedules/:userId
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user exists
         const staffUser = await User.findOne(userId); //This needed to be One not Id
        if (!staffUser) {
            return res.status(404).json({ message: "User not found." });
        }

        // Get schedule entries for this staff user sorted by day of week then start time
        const schedule = await Schedule.find({ Staff: userId })
            .sort({ DayOfWeek: 1, StartTime: 1 });
        console.log("Schedule found: ", schedule);
        res.status(200).json({schedule});
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;