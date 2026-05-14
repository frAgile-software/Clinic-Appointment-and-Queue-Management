const express = require("express");
const router = express.Router();
const Consult = require("../../database/models/Consult");
const User = require("../../database/models/User");

router.get("/:auth0Id", async (req, res) => {
    try {
        const { auth0Id } = req.params;
        
        const user = await User.findOne({ auth0Id });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const consults = await Consult.find({ Patient: user._id })
            .populate("Speciality", "SpecialityName")
            .populate("Staff", "name surname")
            .sort({ createdAt: -1 }); 

        res.status(200).json(consults);
    } catch (error) {
        console.error("Error fetching consults:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;