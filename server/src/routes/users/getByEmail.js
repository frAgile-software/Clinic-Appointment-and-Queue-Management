const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");

router.get("/email/:email", async (req, res) => {
    try {
        const { email } = req.params;
        const { role } = req.query;

        console.log(`Searching for user by ${email}...`);

        const query = {email};
        if (role) query.role = role;

        const user = await User.findOne(query);
        
        if (!user) {
            console.log("User not found.");
            return res.status(200).json(null);
        }

        console.log("User found:", user);
        res.status(200).json(user);

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;