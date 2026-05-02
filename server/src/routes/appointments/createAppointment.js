const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../database/models/User");
const Appointment = require("../../database/models/Appointment");
const Clinic = require("../../database/models/Clinic");

router.post("/", async (req, res) => {
    try {
        const { Clinic: clinicId, Staff, patientAuth0Id, BookingDateTime, description, Speciality } = req.body;

        const patient = await User.findOne({ auth0Id: patientAuth0Id });
        if (!patient) {
            return res.status(404).json({ message: "Patient not found." });
        }

        const staff = await User.findById(Staff);
        if (!staff) {
            return res.status(404).json({ message: "Staff member not found." });
        }

        const clinic = await Clinic.findById(clinicId);
        if (!clinic) {
            return res.status(404).json({ message: "Clinic not found." });
        }

        const existing = await Appointment.findOne({
            Staff,
            BookingDateTime: new Date(BookingDateTime),
        });
        if (existing) {
            return res.status(409).json({ message: "This slot is already booked." });
        }

        const appointment = new Appointment({
            Patient:         patient._id,
            Staff:           staff._id,
            Clinic:          clinic._id,
            Speciality:      Speciality || null,
            BookingDateTime: new Date(BookingDateTime),
            ReasonDetails:   description || '',
        });

        await appointment.save();
        res.status(201).json({ message: "Appointment created successfully.", appointment });

    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;