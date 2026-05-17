const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

// POST /clinics/:clinicId/staff
// Links an unassigned staff member to the specified clinic
router.post("/:clinicId/staff", async (req, res) => {
    try {
        const { clinicId } = req.params;
        const { auth0Id, userId } = req.body;

        if (!auth0Id && !userId)
            return res.status(400).json({ message: "auth0Id or userId is required." });


        const clinic = await Clinic.findById(clinicId);
        if (!clinic)
            return res.status(404).json({ message: "Clinic not found." });

        // Check the user being added is a Staff member
        const staffUser = await User.findOne(
            auth0Id 
                ? { auth0Id, role: "Staff" } 
                : { _id: userId, role: "Staff" }
        );
        if (!staffUser)
            return res.status(404).json({ message: "No staff account found." });


        // Check they aren't already linked to any clinic
        const alreadyLinked = await Staff.findOne({ User: staffUser._id });
        if (alreadyLinked)
            return res.status(409).json({ message: "Staff member is already linked to a clinic." });

        // Link them
        const newLink = await Staff.create({
            User: staffUser._id,
            Clinic: clinic._id,
        });

        res.status(201).json({ message: "Staff linked successfully.", staffId: newLink._id });

    } catch (error) {
        console.error("Link staff error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;