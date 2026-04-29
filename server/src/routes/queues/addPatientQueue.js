const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Queue = require("../../database/models/Queue");

router.post("/", async (req, res) => {
    try {
        console.log("USER REGISTRATION");
        console.log("Incoming Payload:", req.body);
        const { clinicID, specialityID, auth0ID, bookingDateTime } = req.body;
        //Find user by auth0ID
         
        const user = await User.findOne({ auth0Id: auth0ID }); 
        if (!user) return res.status(400).json({ message: "User profile not found." });
        
        // Get referenced clinic
        const clinic = await Clinic.findOne({ _id: clinicID });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found" });

        //check if there's a staff member with the speciality in the clinic
        const staffMember = await User.findOne({ role: "staff", clinic: clinic._id, speciality: specialityID });
        if (!staffMember) 
        return res.status(404).json({ message: "No staff member with specified speciality found in the clinic." });


        console.log("CLINIC FOUND");
        console.log("APPROPRIATE STAFF MEMBER EXISTS");

        //check if user is already in a queue in this clinic
        const existingQueueEntry = await Queue.findOne({ Patient: user._id, Clinic: clinic._id });
        if (existingQueueEntry) 
            return res.status(409).json({ message: "User is already in a queue for this clinic." });

        const newQueue = new Queue({
            Clinic: clinic._id,
            Speciality: specialityID,
            Patient: user._id,
            BookingDateTime: bookingDateTime
        });

        await newQueue.save()
        console.log("Success adding user to queue");
        res.status(200).json({ message: "Successfully joined queue" });

    } catch (error) {
        console.error("Queue error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;