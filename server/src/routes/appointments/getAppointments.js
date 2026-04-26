const express = require("express");
const router = express.Router();

const Appointment = require('../../database/models/Appointment');
const User = require('../../database/models/User');

router.get("/:auth0Id", async (req,res) => {
    try {
        const auth0Id = req.params;

        console.log("Finding user...");
        const user = await User.findOne({ auth0Id });

        if (!user) {
            return res.status(404).json({ message: "User not found."});
        }

        let appointments;
        console.log("User found. Finding appointments...");
        if (user.role === "Patient") {
            appointments = await Appointment.find({Patient: user._id})
                .populate('Patient', '-auth0Id') // return without auth0Id field
                .populate('Staff', '-auth0Id')
                .populate('Clinic')
                .populate('Speciality');
        } else if (user.role === "Staff") {
            appointments = await Appointment.find({Staff: user._id})
                .populate('Patient', '-auth0Id')
                .populate('Staff', '-auth0Id')
                .populate('Clinic')
                .populate('Speciality');
        } else {
            return res.status(404).json({message: "Admin does not have any appointments."});
        }

        if (!appointments || appointments.length === 0) {
            console.log("No appointments found.");
            return res.status(200).json([]);
        }

        console.log("Appointments found.");
        return res.status(200).json(appointments);

    } catch (error) {
        console.log("Error fetching appointments:", error);
        res.status(500).json({message: "Server error."});
    }
});