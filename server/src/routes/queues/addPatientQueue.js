const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Clinic = require("../../database/models/Clinic");
const Queue = require("../../database/models/Queue");
const Speciality = require("../../database/models/Speciality");
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

router.post("/", async (req, res) => {
    try {
        console.log("ADD TO QUEUE");
        console.log("Incoming Payload:", req.body);
        const { clinicID, specialityName, auth0ID, patientId} = req.body;
        //Find user by auth0ID

        let user = null;
        if (patientId) {
            user = await User.findById( patientId ); 
        } else {
            user = await User.findOne({ auth0Id: auth0ID }); 
        }
        if (!user) {
            console.log("User profile not found.");
            return res.status(400).json({ message: "User profile not found." });
        }
        
        // Get referenced clinic
        const clinic = await Clinic.findOne({ _id: clinicID });
        if (!clinic) {
            console.log("Clinic not found.");
            return res.status(404).json({ message: "Clinic not found" });
        }

        const speciality = await Speciality.findOne({ SpecialityName: specialityName});
        if (!speciality) {
            console.log("Speciality not found.");
            return res.status(404).json({ message: "Speciality not found."});
        }

        //check if there's a staff member with the speciality in the clinic
        const staff = await Staff.find({ Clinic: clinic._id }).select('_id');
        const staffIds = staff.map(s => s._id);

        const staffSpeciality = await StaffSpeciality.findOne({
            Staff: { $in: staffIds },
            Speciality: speciality._id
        });

        if (!staffSpeciality) {
            console.log("No staff member with specified speciality found in the clinic.");
            return res.status(404).json({ message: "No staff member with specified speciality found in the clinic." });
        }

        console.log("CLINIC FOUND");
        console.log("APPROPRIATE STAFF MEMBER EXISTS");

        //check if user is already in a queue
        const existingQueueEntry = await Queue.findOne({
            Patient: user._id,
            Status: { $in: ['Waiting', 'In Consult'] },
        });
        if (existingQueueEntry) 
            return res.status(409).json({ message: "User is already in a queue." });

        const newQueue = new Queue({
            Clinic: clinic._id,
            Speciality: speciality._id,
            Patient: user._id,
            Status: "Waiting",
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