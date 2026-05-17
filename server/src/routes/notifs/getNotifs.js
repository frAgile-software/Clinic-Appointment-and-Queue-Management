const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const User = require("../../database/models/User"); // Fixed missing import
const mongoose = require("mongoose");

router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        console.log("Incoming notification check for key:", userId);
        
        let queryId = null;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            queryId = userId;
        } else {
       
            console.log("Detected Auth0 ID parameter string. Finding local user record...");
            const userRecord = await User.findOne({ auth0Id: userId });
            queryId = userRecord?._id;
        }

        if (!queryId) {
            console.log("Could not locate any user corresponding to identity key:", userId);
            return res.status(404).json({ error: "User account reference not found" });
        }

        console.log("Executing query targeting database ObjectId reference:", queryId); 
        
        const notifications = await Notif.find({ Recipient: queryId });
     
        if (!notifications || notifications.length === 0) {
            return res.status(200).json([]); 
        }

        console.log(`Found ${notifications.length} notifications.`);
        res.status(200).json(notifications);

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: "Server error encountered while retrieving notification index" });
    }
});

module.exports = router;