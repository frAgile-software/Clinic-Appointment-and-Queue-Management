const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Queue = require("../../database/models/Queue");
const Clinic = require("../../database/models/Clinic");
const User = require("../../database/models/User");
const Speciality = require("../../database/models/Speciality");
router.put("/:queueId", async (req, res) => {
    try {
        const { queueId } = req.params;
        const { Clinic: clinicId, Speciality: specialityId, Patient: patientId, Status: status} = req.body;
        if(!mongoose.Types.ObjectId.isValid(queueId)) {
            return res.status(400).json({ error: "Invalid queue ID" });
        }
        const queueEntry=await Queue.findById(queueId);
        if (!queueEntry) {
            return res.status(404).json({ error: "Queue entry not found" });
        }
        if (clinicId!== undefined) {
            if (!mongoose.Types.ObjectId.isValid(clinicId)) {
                return res.status(400).json({ error: "Invalid clinic ID" });
            }
            const clinic = await Clinic.findById(clinicId);
            if (!clinic) {
                return res.status(404).json({ error: "Clinic not found" });
            }
            queueEntry.Clinic = clinicId;
        }
        if (specialityId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(specialityId)) {
                return res.status(400).json({ error: "Invalid speciality ID" });
            }
            const speciality = await Speciality.findById(specialityId);
            if (!speciality) {
                return res.status(404).json({ error: "Speciality not found" });
            }
            queueEntry.Speciality = specialityId;
        }
        if (patientId !== undefined) {
            if (!mongoose.Types.ObjectId.isValid(patientId)) {
                return res.status(400).json({ error: "Invalid patient ID" });
            }
            const patient = await User.findById(patientId);
            if (!patient) {
                return res.status(404).json({ error: "Patient not found" });
            }
            queueEntry.Patient = patientId;
        }
        if (status !== undefined) {
            queueEntry.Status = status;
        }
        const updatedQueueEntry = await queueEntry.save();
        return res.status(200).json({
            message: "Queue entry updated successfully.",
            queueEntry: updatedQueueEntry
        });
    } catch (error) {
        console.error("Error updating queue entry:", error);
        return res.status(500).json({
            error: "Internal server error"
        }); 
    }      
    });
    module.exports = router;