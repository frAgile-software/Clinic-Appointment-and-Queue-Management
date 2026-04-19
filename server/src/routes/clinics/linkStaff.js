const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

router.post("/:clinicID/staff", async (req, res) => {
    try {
        const { clinicID } = req.params;
        const { id, email, auth0Id } = req.body;
        
        // Get referenced clinic
        const clinic = await Clinic.exists({ id: clinicID });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });


        // Check if allowed
        const sender = await User.findOne({ auth0Id });
        if (!sender || sender.role != "Admin") 
            return res.status(403).json({ message: "Unauthorized." });

        const senderStaff = await Staff.exists({ Clinic: clinic._id, User: sender._id });
        if (!senderStaff) 
            return res.status(403).json({ message: "Not authorized." });


        // Check if possible
        const user = await User.findOne({ $or: [{ id }, { email }] });
              
        if (!user || !user.role || user.role == "Patient") 
            return res.status(404).json({ message: "User not found." });
        
        
        // Link the staff
        const staff = new Staff({
            Clinic: clinic._id,
            User: user._id
        });

        const savedStaff = await staff.save();

        res.status(201).json({ message: "Staff linked successfully.", staffID: savedStaff.id });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
