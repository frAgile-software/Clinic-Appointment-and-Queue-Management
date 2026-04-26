const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");
const Staff = require("../../database/models/Staff");

router.get("/:clinicID", async (req, res) => {
    try {
        const { specialityID, specialityIDs = [], auth0Id } = req.body;
        const { clinicID } = req.params;

        const allSpecialityIDs = Array.isArray(specialityIDs) ? [...specialityIDs] : [];
        if (specialityID)
            allSpecialityIDs.push(specialityID);
        const uniqueSpecs = [...new Set(allSpecialityIDs)];

        const user = await User.findOne({ auth0Id: auth0Id });
        if (!user) 
            return res.status(403).json({ message: "Unauthorized." });

        const staff = await Staff.findOne({ User: user._id, Clinic: clinicID });
        if (!staff) 
        const queue = await (uniqueSpecs.length === 0 ? 
            Queue.find({ Clinic: staff.Clinic }) :
            Queue.find({ Clinic: staff.Clinic, Speciality: { $in: uniqueSpecs } })
                ).sort({ BookingDateTime: 1 });

        res.status(200).json(queue);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

module.exports = router;