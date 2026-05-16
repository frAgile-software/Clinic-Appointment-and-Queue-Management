const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const mongoose = require("mongoose");

router.get("/:userId", async (req, res) => {
    try {
        console.log("1. Incoming notification request:", req.params);
        
        //get userId
        const {userId, auth0Id} = req.params;
        let queryId = userId;

        if (!queryId && auth0Id){
            const userRecord = await User.findOne({ auth0Id });
            queryId = userRecord?._id;
        }

         console.log("Searching notifications for Recipient:", userId); 
        // Database lookup 
        const notif = await Notif.find({Recipient: userId});

        //No notifications
        if (!notif || notif.length === 0) {
            console.log("No notifications for user id:", userId);
            return res.status(200).json({ message: "No notifications to show" });
        }
        console.log("Notifications found");
        res.status(200).json(notif);

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