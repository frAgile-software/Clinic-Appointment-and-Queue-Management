const express = require("express");

const router = express.Router();

const mongoose = require("mongoose");

const User = require("../../database/models/User");

const Notif = require("../../database/models/Notif");
router.post("/", async (req, res) => {
  try {
    let { recipient, message, time } = req.body;
    console.log("Raw recipient payload received:", recipient);
    if (recipient && typeof recipient === 'object') {
      recipient = recipient.userId || recipient.auth0Id;
    }

    console.log("Normalized recipient string:", recipient);
    if (!recipient) {
      return res.status(400).json({ message: "Recipient identifier is required" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    let queryId = null;
    if (mongoose.Types.ObjectId.isValid(recipient)) {
      console.log("Recipient is a valid MongoDB ObjectId");
      queryId = recipient;
    } else {
      console.log("Recipient is an Auth0 ID string. Querying database...");
      const userRecord = await User.findOne({ auth0Id: recipient });
      queryId = userRecord?._id;
    }
    if (!queryId) {
      return res.status(400).json({ message: "Could not resolve a valid system user from the provided identifier" });
    }
    
    const user = await User.findById(queryId);
    if (!user) {
      return res.status(404).json({ message: "Recipient profile record not found" });
    }
  
    const notif = await Notif.create({
      Recipient: queryId, 
      Message: message,
      Time: time || Date.now(),
      Seen: false,
    });

    res.status(201).json(notif);
  } catch (error) {
    console.error("Notification processing error:", error);
    res.status(500).json({ message: "Server error encountered" });
  }
});

module.exports = router;