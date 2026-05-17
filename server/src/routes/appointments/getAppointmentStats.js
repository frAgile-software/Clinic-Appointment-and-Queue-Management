const express = require("express");
const router = express.Router();
const mongoose = require('mongoose');

const Appointment = require('../../database/models/Appointment');
const Clinic = require('../../database/models/Clinic');
const Staff = require("../../database/models/Staff");
const User = require("../../database/models/User");

const DATE_SEARCH_FIELDS = ["createdAt", "updatedAt", "BookingDateTime"];

router.get("/:clinicID", async (req, res) => {
    try {
        const { clinicID } = req.params;
        const {
            date_search_field = "BookingDateTime",
            _fromdate,
            _todate,
            _order = "asc",
        } = req.query;
        const specialityIDs = req.query.specialityIDs ? req.query.specialityIDs.split(",") : [];
        const statuses = req.query.statuses ? req.query.statuses.split(",") : [];
        const auth0Id = req.auth.payload.sub;

        // Get referenced clinic
        const clinic = await Clinic.findById(clinicID);
        if (!clinic)
            return res.status(404).json({ message: "Clinic not found." });

        // Check if allowed
        const sender = await User.findOne({ auth0Id });
        if (!sender || sender.role != "Admin")
            return res.status(403).json({ message: "Unauthorized." });

        const senderStaff = await Staff.exists({ Clinic: clinic._id, User: sender._id });
        if (!senderStaff)
            return res.status(403).json({ message: "Not authorized." });

        const sortOrder = _order === "asc" ? 1 : -1;
        const targetField = DATE_SEARCH_FIELDS.includes(date_search_field) ? date_search_field : "BookingDateTime";
        const startDateParam = !_fromdate ? {} : { $gte: new Date(_fromdate) };
        const endDateParam = !_todate ? {} : { $lt: new Date(_todate) };
        const dateRangeParam = !_fromdate && !_todate ? {} : { [targetField]: { ...startDateParam, ...endDateParam } };
        const statusesParam = statuses.length === 0 ? {} : { Status: { $in: statuses } };
        const specialitiesParam = specialityIDs.length === 0 ? {} : { Speciality: { $in: specialityIDs } };

        const matchingAppointments = await Appointment.find({
            Clinic: clinic._id,
            ...dateRangeParam,
            ...statusesParam,
            ...specialitiesParam
        }, 'BookingDateTime Speciality Staff Status createdAt updatedAt -type')
            .sort({ [targetField]: sortOrder })
            .populate([
                { path: 'Staff', select: 'name' },
                { path: 'Speciality', select: 'SpecialityName' }
            ]);

        res.status(200).json(matchingAppointments);

    } catch (error) {
        console.log("Error getting appointment stats: ", error)
        res.status(500).json({ message: "Server error." });
    };
});

module.exports = router;