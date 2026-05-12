const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");

router.get("/email/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const user = await User.findOne({ email: email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;