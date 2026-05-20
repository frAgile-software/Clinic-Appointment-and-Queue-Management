const express = require("express");
const router  = express.Router();
const User     = require("../../database/models/User");
const Staff    = require("../../database/models/Staff");
const Schedule = require("../../database/models/Schedule");
const OffDays  = require("../../database/models/OffDays");

// GET /api/schedules/:userId  — returns schedule + off days in one call
router.get("/:userId", async (req, res) => {
    try {
        const userId = decodeURIComponent(req.params.userId);

        const user = await User.findOne({ auth0Id: userId });
        if (!user) return res.status(404).json({ message: "User not found." });

        const staffRecord = await Staff.findOne({ User: user._id });
        if (!staffRecord) return res.status(404).json({ message: "Staff not found." });

        const [schedule, offDays] = await Promise.all([
            Schedule.find({ Staff: staffRecord._id }).sort({ DayOfWeek: 1, StartTime: 1 }),
            OffDays.find({ staff_id: staffRecord._id }).sort({ date: 1 }),
        ]);

        res.status(200).json({ schedule, offDays });
    } catch (err) {
        console.error("Error fetching schedule:", err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;