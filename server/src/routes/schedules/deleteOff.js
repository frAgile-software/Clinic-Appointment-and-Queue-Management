const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const OffDays = require("../../database/models/OffDays");

router.delete("/:offDayId", async (req, res) => {
    try {
        const { offDayId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(offDayId))
            return res.status(400).json({ message: "Invalid ID." });

        const offDay = await OffDays.findByIdAndDelete(offDayId);
        if (!offDay) return res.status(404).json({ message: "Off day not found." });

        res.status(200).json({ message: "Off day removed." });
    } catch (err) {
        console.error("Error deleting off day:", err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;