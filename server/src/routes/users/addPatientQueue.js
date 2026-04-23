const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Queue = require("../../database/models/Queue");

/*Clinic: {type: Schema.Types.ObjectId, ref: 'Clinic', required: true}, //FK
    Speciality: {type: Schema.Types.ObjectId, ref: "Speciality", required: true}, //FK
    Patient: {type: Schema.Types.ObjectId, ref: 'User', required: true}, //FK
    Staff: {type: Schema.Types.ObjectId, ref: 'User', required: true}, //FK
    BookingDateTime: {type: Date, required: true}, //This also aids FIFO logic*/


router.post("/", async (req, res) => {
    try {
        console.log("USER REGISTRATION");
        console.log("Incoming Payload:", req.body);


        const { clinicID, specialityID, bookingDateTime } = req.body; 
        //Note the lack of patient ID: The user may not have one. Instead, reference them by the MongoDB _id, which is generated upon queue entry.
        
        // Get referenced clinic
        const clinic = await Clinic.findOne({ $or:   { id: clinicID } });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });

        console.log("CLINIC FOUND:");
        const newQueue = new Queue({
            Clinic: clinic._id,
            Speciality: specialityID,
            Patient: req.user._id, // Reference the authenticated user
            BookingDateTime: bookingDateTime
        });

    } catch (error) {
        console.error("Queue error:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;