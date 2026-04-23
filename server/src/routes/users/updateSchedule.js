const express = require("express");
const router = express.Router();
const mongoose= require("mongoose");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
//Staff = user id
router.put("/schedule/:scheduleId", async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { Staff, DayOfWeek, StartTime, EndTime } = req.body;
        if(!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({ message: "Invalid schedule ID." });
        }
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: "Schedule entry not found." });
        }
        if(Staff !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(Staff)) {
                return res.status(400).json({ message: "Invalid user ID." });
            }
            const user= await User.findById(Staff);
            if(!user) {
                return res.status(404).json({ message: "User not found." });
            }
            schedule.Staff = Staff;
        }
        if(DayOfWeek !== undefined) {
            if (DayOfWeek < 0 || DayOfWeek > 6) {
                return res.status(400).json({ message: "DayOfWeek must be between 0 and 6." });
            }
            schedule.DayOfWeek = DayOfWeek;
        }

        let newStartTime;
        if (StartTime !== undefined) {
            newStartTime = StartTime;
        } else {
            newStartTime = schedule.StartTime;
        }
        let newEndTime;
        if (EndTime !== undefined) {
            newEndTime = EndTime;
        } else {
            newEndTime = schedule.EndTime;
        }

        if (newEndTime <= newStartTime) {
            return res.status(400).json({ message: "EndTime must be later than StartTime." });
        }

        if (StartTime !== undefined) {
            schedule.StartTime = StartTime;
        }

        if (EndTime !== undefined) {
            schedule.EndTime = EndTime;
        }
        

        const updatedSchedule = await schedule.save();
        res.status(200).json({ message: "Schedule entry updated successfully.", schedule: updatedSchedule });
    } catch (error) {
        console.error("Error updating schedule:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;