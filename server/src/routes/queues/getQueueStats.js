const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Queue = require('../../database/models/Queue');
const Clinic = require('../../database/models/Clinic');

router.get("/:clinicID", async (req, res) => {
    try {
        const { clinicID } = req.params;
        const {
            _fromdate,
            _todate,
            referenceDateTime = Date.now(),
        } = req.query;
        const specialityIDs = req.query.specialityIDs ? req.query.specialityIDs.split(",") : [];

        console.log("QUEUE STATS");
        console.log("specIDs:", specialityIDs);

        const clinic = await Clinic.findById(clinicID);
        if (!clinic)
            return res.status(404).json({ message: "Clinic not found." });

        const startDateParam = !_fromdate ? {} : { $gte: new Date(_fromdate) };
        const endDateParam = !_todate ? {} : { $lt: new Date(_todate) };
        const dateRangeParam = !_fromdate && !_todate
            ? { createdAt: { $gte: new Date(referenceDateTime - 30 * 24 * 60 * 60 * 1000) } } // default averages last 30 days
            : { createdAt: { ...startDateParam, ...endDateParam } };
        const specialitiesParam = specialityIDs.length === 0 ? {} : { Speciality: { $in: specialityIDs } };

        const referenceDate = new Date(referenceDateTime);
        if (Number.isNaN(referenceDate.getTime())) {
            return res.status(400).json({ message: "Invalid referenceDateTime value." });
        }

        const referenceDayOfWeek = referenceDate.getUTCDay() + 1; // +1 since mongo uses different indexing
        const referenceMinutes = referenceDate.getUTCHours() * 60 + referenceDate.getUTCMinutes();

        const filteredQueues = await Queue.aggregate([
            {
                $match: {
                    Clinic: clinic._id,
                    ...specialitiesParam,
                    ...dateRangeParam,
                },
            },
            {
                $match: {
                    $expr: {
                        $eq: [
                            { $dayOfWeek: "$createdAt" },
                            referenceDayOfWeek,
                        ],
                    },
                },
            },
            {
                $match: {
                    $expr: {
                        $lte: [
                            {
                                $abs: {
                                    $subtract: [
                                        { $add: [{ $multiply: [{ $hour: "$createdAt" }, 60] }, { $minute: "$createdAt" }] },
                                        referenceMinutes
                                    ]
                                }
                            },
                            60
                        ]
                    }
                }
            },
            {
                $match: {
                    TimeSeen: { $exists: true },
                },
            },
            {
                $project: {
                    waitTime: {
                        $divide: [
                            { $subtract: ["$TimeSeen", "$createdAt"] },
                            60000,
                        ],
                    },
                },
            },
            {
                $group: {
                    _id: null,
                    averageWaitTime: { $avg: "$waitTime" },
                },
            },
        ]);

        const result = filteredQueues.length > 0 ? filteredQueues[0] : { averageWaitTime: 0 };
        console.log("Average Wait:", result.averageWaitTime);
        res.status(200).json({ averageWaitTime: result.averageWaitTime });

    } catch (error) {
        console.error("Error getting wait time stats: ", error)
        res.status(500).json({ message: "Server error." });
    };
});

module.exports = router;