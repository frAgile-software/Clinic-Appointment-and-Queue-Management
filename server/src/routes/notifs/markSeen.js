const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const User = require("../../database/models/User"); 
const mongoose = require("mongoose");

router.patch("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        let queryId = null;
        console.log("marking for: ", userId);
        if (mongoose.Types.ObjectId.isValid(userId)) {
            console.log("Valid notif id (not auth)")
            queryId = userId;
        } else {
            const userRecord = await User.findOne({ auth0Id: userId });
            console.log("Not valid id!");
            queryId = userRecord?._id;
        }

        if (!queryId) {
            return res.status(404).json({ message: "Recipient user record not found" });
        }

        const result = await Notif.updateMany(
            { Recipient: queryId, Seen: false },
            { $set: { Seen: true } }           
        );
    
        res.status(200).json({ 
            success: true, 
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount 
        });

    } catch (error) {
        res.status(500).json({ error: "Server error encountered while marking notifications as seen" });
    }
});

module.exports = router;