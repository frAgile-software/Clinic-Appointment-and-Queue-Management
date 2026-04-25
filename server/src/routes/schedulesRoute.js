const express = require("express");
const router = express.Router();
const  updateSchedule = require('./schedules/updateSchedule');
const  getUserSchedule = require('./schedules/getUserSchedule');

router.use("/api/schedules", updateSchedule);
router.use("/api/schedules", getUserSchedule);

module.exports = router;