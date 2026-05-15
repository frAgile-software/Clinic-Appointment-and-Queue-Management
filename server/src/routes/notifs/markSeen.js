const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const mongoose = require("mongoose");

router.patch("/:userId", async (req, res) => {
    try {
        console.log(" Incoming request:", req.params);
        const {userId} = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Valid user ID is required" });
        }

        const result = await Notif.updateMany(
            { Recipient: userId, Seen: false },
            { $set: { Seen: true } }           
        );
    

        console.log("Notifications marked as seen");
        res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
