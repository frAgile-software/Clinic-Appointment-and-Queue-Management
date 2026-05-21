const express = require("express");
const router = express.Router();
const Clinic = require("../../database/models/Clinic");
const OffDays = require("../../database/models/OffDays");

// api/schedules/off-days/bulk/:clinicId
router.get("/:clinicId", async (req, res) => {
    try {
        const { clinicId } = req.params;
        const {
            _fromdate,
            _todate,
        } = req.query;
        const staffIDs = req.query.staffIDs?.split(",") ?? [];

        const startDateParam = !_fromdate ? {} : { $gte: new Date(_fromdate) };
        const endDateParam = !_todate ? {} : { $lt: new Date(_todate) };
        const dateRangeParam = !_fromdate && !_todate
            ? { date: { $gte: new Date() } }
            : { date: { ...startDateParam, ...endDateParam } };

        // Get referenced clinic
        const clinic = await Clinic.exists({ _id: clinicId });
        if (!clinic) 
            return res.status(404).json({ message: "Clinic not found." });

        const clinicOffDays = await OffDays.find({ ...dateRangeParam, staff_id: { $in: staffIDs } }).sort({ date: 1 });
        res.status(200).json({ clinicOffDays });
    } catch (err) {
        console.error("Error fetching off days:", err);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;