const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");

router.get("/:auth0Id", async (req, res) => {
    try {
        const { auth0Id } = req.params;
        const user = await User.findOne({ auth0Id });
        
        if (!user) {
            return res.status(404).json({ message: "User profile incomplete." });
        }

        res.status(200).json({ role: user.role, name: user.name });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;