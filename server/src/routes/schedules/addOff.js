const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const OffDays = require("../../database/models/OffDays");

router.post("/", async (req, res) => {
    try {
        const { staffId, dates } = req.body;
        if (!staffId || !dates?.length)
            return res.status(400).json({ message: "staffId and dates are required." });

        const user = await User.findOne({ auth0Id: staffId });
        if (!user) return res.status(404).json({ message: "User not found." });

        const staffRecord = await Staff.findOne({ User: user._id });
        if (!staffRecord) return res.status(404).json({ message: "Staff not found." });

        const existing = await OffDays.find({ staff_id: staffRecord._id });
        const existingSet = new Set(existing.map(d => d.date.toISOString().slice(0, 10)));
        const newDates = dates.filter(d => !existingSet.has(d));

        if (!newDates.length)
            return res.status(409).json({ message: "All selected dates are already taken off." });

        const created = await OffDays.insertMany(
            newDates.map(date => ({ staff_id: staffRecord._id, date: new Date(date + "T12:00:00Z") }))
        );
        res.status(201).json({ offDays: created });
    } catch (err) {
        console.error("Error creating off days:", err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;