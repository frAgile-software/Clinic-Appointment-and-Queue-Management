const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const User = require("../../database/models/User");
const mongoose = require("mongoose");

router.delete("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        let queryId = null;

        if (mongoose.Types.ObjectId.isValid(userId)) {
            queryId = userId;
        } else {
            const userRecord = await User.findOne({ auth0Id: userId });
            queryId = userRecord?._id;
        }

        if (!queryId) {
            return res.status(404).json({ message: "Recipient user record not found" });
        }

        const result = await Notif.deleteMany({
            Recipient: queryId,
            Seen: true
        });

        res.status(200).json({
            success: true,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        res.status(500).json({ error: "Server error encountered while deleting notifications" });
    }
});

module.exports = router;