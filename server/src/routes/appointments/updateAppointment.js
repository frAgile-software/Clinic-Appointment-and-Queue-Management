const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../../database/models/User");
const Appointment = require("../../database/models/Appointment");
const Clinic = require("../../database/models/Clinic");
//const Staff = require("../../database/models/Staff");
const Speciality = require("../../database/models/Speciality");
router.put("/:appointmentID", async (req, res) => {
    try{
        const { appointmentID } = req.params;
        const { Patient, Staff, Clinic: clinicId, BookingDateTime, Speciality: specialityId } = req.body;
        if(!mongoose.Types.ObjectId.isValid(appointmentID)) {
            return res.status(400).json({ message: "Invalid appointment ID." });
        }
        const appointment = await Appointment.findById(appointmentID);
        if(!appointment) {
            return res.status(404).json({ message: "Appointment not found." });
        }
        if(Patient!== undefined) {
            if(!mongoose.Types.ObjectId.isValid(Patient)) {
                return res.status(400).json({ message: "Invalid patient ID." });
            }
            const patientUser = await User.findById(Patient);
            if(!patientUser){
                return res.status(404).json({ message: "Patient not found." });
            }
            appointment.Patient = Patient;
        }
        if (Staff !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(Staff)) {
                return res.status(400).json({ message: "Invalid staff ID." });
            }

            const staffUser = await User.findById(Staff);
            if (!staffUser) {
                return res.status(404).json({ message: "Staff member not found." });
            }

            appointment.Staff = Staff;
        }

        if (clinicId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                return res.status(400).json({ message: "Invalid clinic ID." });
            }

            const clinic = await Clinic.findById(clinicId);
            if (!clinic) {
                return res.status(404).json({ message: "Clinic not found." });
            }

            appointment.Clinic = clinicId;
        }
        if(BookingDateTime !== undefined) {
            const bookingDate = new Date(BookingDateTime);
            if(isNaN(bookingDate.getTime())) {
                return res.status(400).json({ message: "Invalid booking date." });
            }
            appointment.BookingDateTime = bookingDate;
        }
        if(specialityId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(specialityId)) {
                return res.status(400).json({ message: "Invalid speciality ID." });
            }
            const speciality = await Speciality.findById(specialityId);
            if (!speciality) {
                return res.status(404).json({ message: "Speciality not found." });
            }
            appointment.Speciality = specialityId;

        }
        const updatedAppointment = await appointment.save();
        res.status(200).json({ message: "Appointment updated successfully.", appointment: updatedAppointment });
    }catch(error) {
        console.error("Error updating appointment:", error);
        res.status(500).json({ message: "Server error." });
    }



});
module.exports = router;