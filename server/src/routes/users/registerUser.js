const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");

router.post("/", async (req, res) => {
    try {
        console.log("USER REGISTRATION");
        console.log("Incoming Payload:", req.body);

        const { auth0Id, name, surname, title, email, role } = req.body;

        if (!auth0Id || !name || !surname || !email || !role) {
            console.log("FAIL: Missing required fields");
            return res.status(400).json({ message: "Missing required fields." });
        }
        
        console.log("Payload validated");

        const existingUser = await User.findOne({ $or: [{ email }, { auth0Id }] });
        if (existingUser) {
            console.log("FAIL: User already exists in database");
            return res.status(409).json({ message: "User already registered." });
        }

        console.log("No duplicates found. Creating user...");
        const newUser = new User({
            auth0Id, name, surname, title, email, role
        });

        console.log("Attempting to save to MongoDB...");
        await newUser.save();
        
        console.log("Success registering user!");
        res.status(201).json({ message: "Registration successful.", role: newUser.role });

    } catch (error) {
        console.error("ERROR:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;