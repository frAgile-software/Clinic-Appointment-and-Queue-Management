const express = require("express");
const router = express.Router();
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

// GET /api/schedules/:userId
router.get("/:userId", async (req, res) => {
    try {
        const userId = decodeURIComponent(req.params.userId);
       

        const user = await User.findOne({ auth0Id: userId });
        

        const staffUser = await User.findOne(userId); //This needed to be One not Id

        const schedule = await Schedule.find({ Staff: staffUser._id })
            .sort({ DayOfWeek: 1, StartTime: 1 });
    

        res.status(200).json({ schedule });
    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});
module.exports = router;