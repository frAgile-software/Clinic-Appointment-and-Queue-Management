const express = require("express");
const router = express.Router();
const Notifs = require("../../database/models/Notifs");
const mongoose = require("mongoose");

router.delete("/:userId", async (req, res) => {
    try {
        console.log("1. Incoming request:", req.params);
        const {userId} = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        const notifs= await Notifs.deleteMany({
            Recipient: userId,
            Seen: true
    });

        if (notifs.deletedCount===0) {
            console.log("No notifications deleted");
            return res.status(200).json({ message: "No notifications deleted" });
        }
        console.log("Seen notifications deleted");
        res.status(200).json(notifs);
        
    } catch (error) {
        if (error.name === "CastError") {
            console.error("Invalid ObjectId format:", req.params);
            return res.status(400).json({ error: "Invalid user ID format" });
        }
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;