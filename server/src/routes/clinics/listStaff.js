const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

// GET /clinics/:clinicID/staff - Public route
router.get("/:clinicID/staff", async (req, res) => {
    try {
        const { clinicID } = req.params;

        // Get referenced clinic
        const clinic = await Clinic.exists({ _id: clinicID });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });

        // Find all staff linked to this clinic, and populate the User reference
        const linkedStaff = await Staff.find({ Clinic: clinicID })
            .populate('User', 'name surname email role title');

        if (!linkedStaff || linkedStaff.length === 0) {
            return res.status(200).json({ 
                message: "No staff found for this clinic.", 
                users: [] 
            });
        }

        const staffUsers = linkedStaff
        .filter((staffRecord) => staffRecord.User && staffRecord.User.role === "Staff")
        .map((staffRecord) => ({
            _id: staffRecord.User._id,          
            userId: staffRecord.User._id,       
            staffId: staffRecord._id,           
            name: staffRecord.User.name,
            surname: staffRecord.User.surname,
            email: staffRecord.User.email,
            role: staffRecord.User.role,
            title: staffRecord.User.title
        }));

        
        res.status(200).json({ 
            message: "Retrieved linked staff successfully.", 
            users: staffUsers
        });

    } catch (error) {
        console.error("Error in listStaff:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;