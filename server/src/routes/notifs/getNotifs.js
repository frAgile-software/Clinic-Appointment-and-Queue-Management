const express = require("express");
const router = express.Router();
const Notifs = require("../../database/models/Notifs");

router.get("/:userId", async (req, res) => {
    try {
        console.log("1. Incoming request:", req.params);
        const { userId} = req.params;
        // Database lookup 
        const notifs= await Notifs.find(userId);

        //No notifications
        if (!notifs) {
            console.log("No notifications for user id:", userId);
            return res.status(200).json({ message: "No notifications to show" });
        }
        console.log("Notifications found");
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