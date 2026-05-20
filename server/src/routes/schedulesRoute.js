const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const getUserSchedule = require('./schedules/getUserSchedule');
const createSchedule  = require('./schedules/createSchedule');
const deleteSchedule  = require('./schedules/deleteSchedule');
const deleteOff       = require('./schedules/deleteOff');
const getOff          = require('./schedules/getOff');
const addOff          = require('./schedules/addOff');

router.use("/api/schedules/off-days", requireAuth, getOff);
router.use("/api/schedules/off-days", requireAuth, addOff);
router.use("/api/schedules/off-days", requireAuth, deleteOff);

router.use("/api/schedules", requireAuth, getUserSchedule);
router.use("/api/schedules", requireAuth, createSchedule);
router.use("/api/schedules", requireAuth, deleteSchedule);
router.use("/api/schedules", requireAuth, createBulk);

module.exports = router;