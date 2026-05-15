const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Notif = require("../../database/models/Notif");

router.post("/", async (req, res) => {
  try {
    const { recipient, message, time } = req.body;
    
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