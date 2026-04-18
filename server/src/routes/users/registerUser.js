const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");

router.post("/", async (req, res) => {
    try {
        console.log("1. Incoming Payload:", req.body);

        const { auth0Id, name, surname, title, email, role } = req.body;

        // Validation
        if (!auth0Id || !name || !surname || !email || !role) {
            console.log("FAIL: Missing required fields");
            return res.status(400).json({ message: "Missing required fields." });
        }
        
        console.log("2. Validation Passed");

        // Check for existing user conflicts globally
        const existingUser = await User.findOne({ $or: [{ email }, { auth0Id }] });
        if (existingUser) {
            console.log("FAIL: User already exists in database");
            return res.status(409).json({ message: "Email or Auth0 ID already registered." });
        }

        console.log("3. No duplicates found. Creating user...");
        const newUser = new User({
            auth0Id, name, surname, title, email, role
        });

        console.log("4. Attempting to save to MongoDB...");
        const savedUser = await newUser.save();
        
        console.log("5. SUCCESS: Saved to database.");
        res.status(201).json({ message: "Registration successful.", role: savedUser.role });

    } catch (error) {
        console.error("CRITICAL ERROR:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;