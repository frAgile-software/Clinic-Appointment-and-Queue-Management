const express = require("express");
const router = express.Router();
const User = require("../src/database/models/User");

// Lookup user by Auth0 ID
router.get("/:auth0Id", async (req, res) => {
    try {
        const { auth0Id } = req.params;
        
        const user = await User.findOne({ auth0Id });
        
        if (!user) {
            // User authenticated with Auth0 but is not in our database yet
            return res.status(404).json({ message: "User profile incomplete." });
        }

        // Return the role so the frontend knows where to redirect
        res.status(200).json({ role: user.role, name: user.name });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;