const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

router.get("/:clinicID/staff", async (req, res) => {
    try {
        const { clinicID } = req.params;
        const { auth0Id } = req.query;
        
        // Get referenced clinic
        const clinic = await Clinic.exists({ _id: clinicID });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });


        // Check if allowed
        const sender = await User.findOne({ auth0Id });
        if (!sender) 
            return res.status(403).json({ message: "Unauthorized." });

        const senderStaff = await Staff.exists({ Clinic: clinic._id, User: sender._id });
        if (!senderStaff) 
            return res.status(403).json({ message: "Unauthorized." });


        // Get and return linked staff
        const linkedStaff = await Staff.find({ Clinic: clinicID }).populate({
          path: "User",
          select: "-auth0Id"
        });
        const linkedUsers = linkedStaff.map(staff => staff.User);
        
        res.status(200).json({ message: "Retrieved linked staff successfully.", users: linkedUsers });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
