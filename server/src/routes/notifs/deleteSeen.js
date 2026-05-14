const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const mongoose = require("mongoose");

router.delete("/:userId", async (req, res) => {
    try {
        console.log("1. Incoming request:", req.params);
        const {userId} = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const result = await Notif.deleteMany({
            Recipient: userId,
            Seen: true
    });

    if (result.deletedCount===0) {
        console.log("No notifications deleted");
        return res.status(200).json(result);
    }
    else{
        console.log("Seen notifications deleted");
        res.status(200).json(result);
    }
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;