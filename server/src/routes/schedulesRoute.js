const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const updateSchedule = require('./schedules/updateSchedule');
const getUserSchedule = require('./schedules/getUserSchedule');
const createSchedule = require('./schedules/createSchedule');
const editSchedule =     require('./schedules/editSchedule');
const deleteSchedule =     require('./schedules/deleteSchedule');

router.use("/api/schedules", requireAuth, updateSchedule);
router.use("/api/schedules", requireAuth, getUserSchedule);
router.use("/api/schedules", requireAuth, createSchedule);
router.use("/api/schedules", requireAuth, editSchedule);
router.use("/api/schedules", requireAuth, deleteSchedule);

module.exports = router;