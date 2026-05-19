const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

// DELETE /api/schedules/:scheduleId
// Removes a schedule block when staff unchecks a slot
// Optional query param: ?staffId=... for ownership check
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
 
        // If staffId provided, ensure the block belongs to them
        if (staffId && schedule.Staff.toString() !== staffId) {
            return res.status(403).json({ message: "You do not own this schedule block." });
        }
 
        await Schedule.findByIdAndDelete(scheduleId);
        res.status(200).json({ message: "Schedule block deleted." });
    } catch (error) {
        console.error("Error deleting schedule block:", error);
        res.status(500).json({ message: "Server error." });
    }
});
 
module.exports = router;