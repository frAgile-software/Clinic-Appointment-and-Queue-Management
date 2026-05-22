const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");

// DELETE /api/schedules/:scheduleId
router.delete("/:scheduleId", async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { staffId } = req.query;

        if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
            return res.status(400).json({ message: "Invalid schedule ID." });
        }

        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).json({ message: "Schedule block not found." });
        }

        if (staffId) {
            const staffUser = await User.findOne({ auth0Id: decodeURIComponent(staffId) });
            if (!staffUser) {
                return res.status(404).json({ message: "User not found." });
            }

            const staffRecord = await Staff.findOne({ User: staffUser._id });
            if (!staffRecord || schedule.Staff.toString() !== staffRecord._id.toString()) {
                return res.status(403).json({ message: "You do not own this schedule block." });
            }
        }

        await Schedule.findByIdAndDelete(scheduleId);
        res.status(200).json({ message: "Schedule block deleted." });
    } catch (error) {
        console.error("Error deleting schedule block:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;