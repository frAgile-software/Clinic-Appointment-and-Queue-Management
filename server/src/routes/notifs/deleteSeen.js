const express = require("express");
const router = express.Router();
const Notif = require("../../database/models/Notif");
const mongoose = require("mongoose");

router.delete("/:userId", async (req, res) => {
    try {
        console.log(" Incoming request:", req.params);
        const {userId} = req.params;

        const result = await Notif.deleteMany({
            Recipient: userId,
            Seen: true
    });

        console.log("Seen notifications deleted");
        res.status(200).json(result);

    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;