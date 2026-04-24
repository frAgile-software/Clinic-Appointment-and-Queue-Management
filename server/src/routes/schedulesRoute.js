const express = require("express");
const router = express.Router();
const  getUserSchedule = require('./schedules/getUserSchedule');

router.use("/api/schedules", getUserSchedule);

module.exports = router;