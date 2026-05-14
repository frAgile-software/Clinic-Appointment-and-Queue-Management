const express = require('express');
const router = express.Router();

const Appointment = require('../../database/models/Appointment');
const PatientLog = require('../../database/models/PatientLog');

router.delete('/:appointmentId', async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({message: "Not found."});
        };

        console.log("Appointment found.");

        const appointmentTime = new Date(appointment.BookingDateTime).getTime();
        const currentTime = Date.now();
        const hoursDifference = (appointmentTime - currentTime) / (1000 * 60 * 60);

        if (hoursDifference < 24) {
            return res.status(400).json({ message: "Appointments cannot be cancelled less than 24 hours before the scheduled time." });
        }

        const newPatientLog = new PatientLog({
            Speciality: appointment.Speciality,
            Patient: appointment.Patient,
            Staff: appointment.Staff,
            VisitType: "Appointment",
            TimeIn: appointment.BookingDateTime, //stores the original booking date
            TimeOut: Date.now(),
            TimeQStart: appointment.createdAt, //stores the time booking was made
            Status: "Cancelled",
        });

        await newPatientLog.save();

        console.log("Appointment logged as cancelled in PatientLog.");

        await appointment.updateOne({ Status: "Cancelled" });

        res.status(200).json({message: "Appointment cancelled", patientLog: newPatientLog})

    } catch (error) {
        console.log("Cancel appointment error:",error);
        res.status(500).json({message: "Server error."});
    };
});

module.exports = router;