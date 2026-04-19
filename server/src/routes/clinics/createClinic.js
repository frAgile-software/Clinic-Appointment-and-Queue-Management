const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

router.post("/", async (req, res) => {
    try {
        const { clinicID, practiceNumber, auth0Id } = req.body;
        
        // Get referenced clinic
        const clinic = await Clinic.findOne({ $or:  [ { id: clinicID }, {practiceNumber} ] });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });


        // Check if allowed
        const sender = await User.findOne({ auth0Id });
        if (!sender || sender.role != "Admin") 
            return res.status(403).json({ message: "Unauthorized." });
        
        // Link the staff
        const staff = new Staff({
            Clinic: clinic._id,
            User: sender._id
        });

        const savedStaff = await staff.save();

        res.status(201).json({ message: "Clinic linked successfully.", clinicID: savedStaff.Clinic.id });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
