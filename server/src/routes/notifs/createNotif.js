const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../database/models/User");
const Notif = require("../../database/models/Notif");

router.post("/", async (req, res) => {
  try {
    const { recipient, message, time } = req.body;
    console.log("Creating notification for id",recipient);
    const {userId, auth0Id} = recipient;
    let queryId = userId;
    if (!queryId && auth0Id){
        const userRecord = await User.findOne({ auth0Id });
        queryId = userRecord?._id;
    }

    if (!recipient || !mongoose.Types.ObjectId.isValid(recipient)) {
      return res.status(400).json({ message: "Valid recipient is required" });
    }

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const user = await User.findById(recipient);

    if (!user) {
      return res.status(404).json({ message: "Recipient user not found" });
    }
    
    const notif = await Notif.create({
      Recipient: recipient,
      Message: message,
      Time: time || Date.now(),
      Seen: false,
    });

    res.status(201).json(notif);
  } catch (error) {
    console.error("Notification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;
