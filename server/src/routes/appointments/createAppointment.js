const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../database/models/User");
const Appointment = require("../../database/models/Appointment");
const Clinic = require("../../database/models/Clinic");
const SpecialityModel = require("../../database/models/Speciality"); 

router.post("/", async (req, res) => {
    try {
        const { Clinic: clinicId, Staff, patientAuth0Id, BookingDateTime, description, Speciality, rescheduleAppointmentId } = req.body;

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
            Status: { $ne: "Cancelled" }
        });
        if (existing && existing._id.toString() !== rescheduleAppointmentId) {
            return res.status(409).json({ message: "This slot is already booked." });
        }

        let specialityId = null;
        if (Speciality) {
            const specDoc = await SpecialityModel.findOne({ SpecialityName: Speciality });
            if (specDoc) {
                specialityId = specDoc._id;
            }
        }

        if (rescheduleAppointmentId) {
            const appointment = await Appointment.findById(rescheduleAppointmentId);
            if (!appointment) {
                return res.status(404).json({ message: "Original appointment not found." });
            }

            appointment.Clinic = clinic._id;
            appointment.Staff = staff._id;
            appointment.BookingDateTime = new Date(BookingDateTime);
            appointment.ReasonDetails = description || '';
            appointment.Status = "Waiting";
            appointment.type = "Appointment";
            if (specialityId) {
                appointment.Speciality = specialityId;
            }

            await appointment.save();
            return res.status(200).json({ message: "Appointment rescheduled successfully.", appointment });
        }

        const apptData = {
            Patient:         patient._id,
            Staff:           staff._id,
            Clinic:          clinic._id,
            BookingDateTime: new Date(BookingDateTime),
            ReasonDetails:   description || '',
        };

        if (specialityId) {
            apptData.Speciality = specialityId;
        }

        const appointment = new Appointment(apptData);

        await appointment.save();
        res.status(201).json({ message: "Appointment created successfully.", appointment });

    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;