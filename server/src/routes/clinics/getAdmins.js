const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Staff = require("../../database/models/Staff");

router.get("/:clinicID/admins", async (req, res) => {
     try {
            const { clinicID } = req.params;
    
            // Get referenced clinic
            const clinic = await Clinic.exists({ _id: clinicID });
            if (!clinic) 
                return res.status(404).json({ message: "Clinic not found." });
    
            const linkedAdmins = await Staff.find({ Clinic: clinicID })
                .populate('User', 'name surname email role title');
    
            if (!linkedAdmins|| linkedAdmins.length === 0) {
                return res.status(200).json({ 
                    message: "No admins found for this clinic.", 
                    users: [] 
                });
            }
    
            // Extract populated user objects, keep Staff role only (exclude Admins)
            const adminUsers = linkedAdmins
                .map(s => s.User)
                .filter(u => u && u.role === 'Admin');
    
            
            res.status(200).json({ 
                message: "Retrieved linked admin successfully.", 
                users: adminUsers
            });
    
        } catch (error) {
            console.error("Error in getAdmins:", error);
            res.status(500).json({ message: "Server error." });
        }
    });
    
    module.exports = router;