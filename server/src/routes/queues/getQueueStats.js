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
            _groupby,
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

        
        console.log('Filtering on:', {
            referenceDate: referenceDate.toISOString(),
            referenceDayOfWeek,
            referenceMinutes,
            specialitiesParam,
            _groupby,
        });

        // shared aggregations
        const baseMatch = [
            {
                $match: {
                    Clinic: clinic._id,
                    ...specialitiesParam,
                    ...dateRangeParam,
                },
            },
            {
                $match: {
                    TimeSeen: { $exists: true },
                },
            },
            {
                $project: {
                    createdAt: 1,
                    waitTime: {
                        $divide: [
                            { $subtract: ["$TimeSeen", "$createdAt"] },
                            60000,
                        ],
                    },
                },
            },
        ];

        // full data: grouped by either day or hour
        if (_groupby === 'day' || _groupby === 'hour') {
            const groupId = _groupby === 'day' 
                ? {dayOfWeek: { $dayOfWeek: "$createdAt" } }
                : {hour: { $hour: "$createdAt" } };

            const pipeline = [
                ...baseMatch,
                { $group: { _id: groupId, avgWait: { $avg: "$waitTime" }, count: { $sum: 1 } } },
                { $sort: { "_id": 1 } },
            ];

            const results = await Queue.aggregate(pipeline);

            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            const formatted = results.map((r) => ({
                label: _groupby === 'day'
                    ? dayNames[r._id.dayOfWeek - 1]
                    : `${String(r._id.hour).padStart(2, '0')}:00`,
                avgWait: Math.round(r.avgWait * 10) / 10,
                count: r.count,
            }));

            return res.status(200).json({ _groupby, data: formatted });
        }

        // current average wait time
        const pipeline = [
            ...baseMatch.slice(0, 1),
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
            ...baseMatch.slice(1),
            {
                $group: {
                    _id: null,
                    averageWaitTime: { $avg: "$waitTime" },
                },
            }
        ]

        const filteredQueues = await Queue.aggregate(pipeline);
        const result = filteredQueues.length > 0 ? filteredQueues[0] : { averageWaitTime: 0 };
        console.log("Average Wait:", result.averageWaitTime);
        res.status(200).json({ averageWaitTime: result.averageWaitTime });

    } catch (error) {
        console.error("Error getting wait time stats: ", error)
        res.status(500).json({ message: "Server error." });
    };
});

module.exports = router;