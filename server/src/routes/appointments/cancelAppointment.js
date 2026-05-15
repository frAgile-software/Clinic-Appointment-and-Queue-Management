const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Appointment = require('../../database/models/Appointment');
const User = require('../../database/models/User');

router.patch('/:appointmentId', async (req, res) => {
    try {
        const appointmentId = req.params.appointmentId;
        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({message: "Not found."});
        };

        console.log("Appointment found.");

        // --- 24-HOUR RESTRICTION CHECK ---
        let isStaffOrAdmin = false;
        const requesterAuth0Id = req.auth?.payload?.sub;
        
        if (requesterAuth0Id) {
            const requester = await User.findOne({ auth0Id: requesterAuth0Id });
            if (requester && (requester.role === 'Staff' || requester.role === 'Admin')) {
                isStaffOrAdmin = true;
            }
        }

        if (!isStaffOrAdmin) {
            const appointmentTime = new Date(appointment.BookingDateTime).getTime();
            const currentTime = Date.now();
            const hoursDifference = (appointmentTime - currentTime) / (1000 * 60 * 60);

            if (hoursDifference < 24) {
                return res.status(400).json({ message: "Appointments cannot be cancelled less than 24 hours before the scheduled time." });
            }
        }
        // ---------------------------------

        await Appointment.updateOne(
            { _id: appointmentId },
            { Status: "Cancelled" }
        );

        const updatedAppointment = await Appointment.findById(appointmentId);

        console.log("Appointment logged as cancelled.");

        res.status(200).json({message: "Appointment cancelled", appointment: updatedAppointment});

    } catch (error) {
        console.log("Cancel appointment error:",error);
        res.status(500).json({message: "Server error."});
    };
});

module.exports = router;