const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Schedule = require("../../database/models/Schedule");
const User = require("../../database/models/User");

router.delete("/staff/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID." });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const result = await Schedule.deleteMany({ Staff: userId });

        return res.status(200).json({
            message: "Staff schedules deleted successfully.",
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error("Error deleting staff schedules:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;