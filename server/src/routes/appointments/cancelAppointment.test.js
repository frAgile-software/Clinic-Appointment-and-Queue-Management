const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../database/models/User");
const Appointment = require("../../database/models/Appointment");
const Clinic = require("../../database/models/Clinic");
const SpecialityModel = require("../../database/models/Speciality"); 

router.post("/", async (req, res) => {
    try {
        const { Clinic: clinicId, Staff, patientAuth0Id, BookingDateTime, description, Speciality, rescheduleId } = req.body;

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

        // Handle conflict check, excluding the current appointment if rescheduling
        const conflictQuery = { Staff, BookingDateTime: new Date(BookingDateTime) };
        if (rescheduleId) conflictQuery._id = { $ne: rescheduleId };
        
        const existing = await Appointment.findOne(conflictQuery);
        if (existing) {
            return res.status(409).json({ message: "This slot is already booked." });
        }

        let specialityId = null;
        if (Speciality) {
            const specDoc = await SpecialityModel.findOne({ SpecialityName: Speciality });
            if (specDoc) {
                specialityId = specDoc._id;
            }
        }

        if (rescheduleId) {
            const appointment = await Appointment.findById(rescheduleId);
            if (!appointment) return res.status(404).json({ message: "Original appointment not found." });

            // --- 24-HOUR RESTRICTION CHECK ---
            let isStaffOrAdmin = false;
            const requesterAuth0Id = req.auth?.payload?.sub;
            if (requesterAuth0Id) {
                const requester = await User.findOne({ auth0Id: requesterAuth0Id });
                if (requester && (requester.role === 'Staff' || requester.role === 'Admin')) isStaffOrAdmin = true;
            }

            if (!isStaffOrAdmin) {
                const hoursDifference = (new Date(appointment.BookingDateTime).getTime() - Date.now()) / (1000 * 60 * 60);
                if (hoursDifference < 24) return res.status(400).json({ message: "Cannot reschedule less than 24 hours before." });
            }

            // Update existing instead of creating new
            appointment.Clinic = clinic._id;
            appointment.Staff = staff._id;
            appointment.BookingDateTime = new Date(BookingDateTime);
            appointment.ReasonDetails = description || '';
            if (specialityId) appointment.Speciality = specialityId;

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

        if (specialityId) apptData.Speciality = specialityId;

        const appointment = new Appointment(apptData);
        await appointment.save();
        res.status(201).json({ message: "Appointment created successfully.", appointment });

    } catch (error) {
        console.error("Error creating appointment:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;