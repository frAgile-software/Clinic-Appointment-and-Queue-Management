const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");
const Speciality = require("../../database/models/Speciality");

router.get("/:staffID/specialities", async (req, res)=> {
    try {
        const { staffID } = req.params;

        console.log("Fetching staff specialities for UserID:", staffID);

        const staff = await User.findById(staffID);
        if (!staff) {
            console.log("User not found.");
            return res.status(404).json({message: "Specified staff not found."});
        }
        console.log("User found.");

        if (staff.role !== "Staff") {
            console.log("User is not a staff.");
            return res.status(403).json({message: "User is not a staff member."});
        }
        console.log("User is staff. Finding Staff doc...");

        const staffDoc = await Staff.findOne({ User: staffID });
        if (!staffDoc) {
            console.log("User not assigned to a clinic.");
            res.status(404).json({message: "User not assigned to a clinic."});
        }

        console.log("Staff doc found. Finding specialities...");
        
        const results = await StaffSpeciality.find({Staff: staffDoc._id}).populate('Speciality');

        console.log("Specialities found:", results);
        console.log("Names list:", results.map(r => r.Speciality.SpecialityName));

        // returns list of specialities
        return res.status(200).json({
            UserId: staffID, 
            Specialities: results.map(r => r.Speciality.SpecialityName)
        });

    } catch (error) {
        console.error("User lookup error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;
