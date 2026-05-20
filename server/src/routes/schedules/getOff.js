const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const OffDays = require("../../database/models/OffDays");

router.get("/:userId", async (req, res) => {
    try {
        const userId = decodeURIComponent(req.params.userId);
        const user = await User.findOne({ auth0Id: userId });
        if (!user) return res.status(404).json({ message: "User not found." });
        const staffRecord = await Staff.findOne({ User: user._id });
        if (!staffRecord) return res.status(404).json({ message: "Staff not found." });
        const offDays = await OffDays.find({ staff_id: staffRecord._id }).sort({ date: 1 });
        res.status(200).json({ offDays });
    } catch (err) {
        console.error("Error fetching off days:", err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;