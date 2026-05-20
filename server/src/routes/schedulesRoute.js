const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');


const getUserSchedule = require('./schedules/getUserSchedule');
const createSchedule = require('./schedules/createSchedule');
const deleteSchedule =     require('./schedules/deleteSchedule');
const createBulk = require('./schedules/createBulk');

router.use("/api/schedules", requireAuth, getUserSchedule);
router.use("/api/schedules", requireAuth, createSchedule);
router.use("/api/schedules", requireAuth, deleteSchedule);
router.use("/api/schedules", requireAuth, createBulk);

module.exports = router;