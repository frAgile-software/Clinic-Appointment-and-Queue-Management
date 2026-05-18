const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");

router.get("/patient/:auth0Id", async (req, res) => {
    try {
        const { auth0Id } = req.params;

        const patient = await User.findOne({ auth0Id: auth0Id });
        if (!patient)
            return res.status(404).json({ message: "Patient not found." });

        const queue = await Queue.findOne({ Patient: patient._id, Status: "Waiting", })
            .populate('Clinic')
            .populate('Speciality');
        if (!queue)
            return res.status(200).json({inQueue: false});

        // getting their position in the queue
        const queueList = await Queue.find({
            Clinic: queue.Clinic._id,
            Speciality: queue.Speciality._id,
            Status: "Waiting",
        }).sort({ updatedAt: 1 });
        const position = queueList.findIndex(q => q.Patient.toString() === patient._id.toString()) + 1;

        res.status(200).json({inQueue: true, queue: { queue, position: position }});

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

module.exports = router;