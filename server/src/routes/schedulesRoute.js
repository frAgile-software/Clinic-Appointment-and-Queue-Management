const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const updateSchedule = require('./schedules/updateSchedule');
const getUserSchedule = require('./schedules/getUserSchedule');
const createSchedule = require('./schedules/createSchedule');
const deleteStaffSchedules = require("./schedules/deleteStaffSchedules");

router.use("/api/schedules", requireAuth, updateSchedule);
router.use("/api/schedules", requireAuth, deleteStaffSchedules);
router.use("/api/schedules", requireAuth, getUserSchedule);
router.use("/api/schedules", requireAuth, createSchedule);

module.exports = router;