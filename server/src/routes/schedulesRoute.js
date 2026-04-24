const express = require("express");
const router = express.Router();
const  updateSchedule = require('./schedules/updateSchedule');

router.use("/api/schedules", updateSchedule);

module.exports = router;