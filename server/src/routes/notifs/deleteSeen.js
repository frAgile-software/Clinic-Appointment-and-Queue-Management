const express = require("express");
const router = express.Router();
const Notifs = require("../../database/models/Notifs");
const mongoose = require("mongoose");

router.delete("/:staffId", async (req, res) => {
    try {
        console.log("1. Incoming request:", req.params);
        const {staffId} = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(staffId)) {
            return res.status(400).json({ error: "Invalid queue ID" });
        }

        const notifs= await Notifs.deleteMany({
            Recipient: staffId,
            Seen: true
    });

        if (!notifs) {
            console.log("No notifications deleted");
            return res.status(200).json({ message: "No notifications deleted" });
        }
        console.log("Seen notifications deleted");
        res.status(200).json(notifs);
        
    } catch (error) {
        if (error.name === "CastError") {
            console.error("Invalid ObjectId format:", req.params.id);
            return res.status(400).json({ error: "Invalid staff ID format" });
        }
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;