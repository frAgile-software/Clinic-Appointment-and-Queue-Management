const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const StaffSpeciality = require("../../database/models/StaffSpeciality");
const Speciality = require("../../database/models/Speciality");

router.get("/:staffID/specialities", async (req, res)=> {
    try {
        const { staffID } = req.params;

        const staff = await User.findById(staffID);
        if (!staff) {
            return res.status(404).json({message: "Specified staff not found."});
        }

        if (staff.role !== "Staff") {
            return res.status(403).json({message: "User is not a staff member."});
        }

        const results = await StaffSpeciality.find({Staff: staffID}).populate('Speciality');

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
