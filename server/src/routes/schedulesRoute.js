const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const getUserSchedule = require('./schedules/getUserSchedule');
const createSchedule  = require('./schedules/createSchedule');
const deleteSchedule  = require('./schedules/deleteSchedule');
const deleteOff       = require('./schedules/deleteOff');
const getOff          = require('./schedules/getOff');
const addOff          = require('./schedules/addOff');

router.use("/schedules/off-days", requireAuth, deleteOff);
router.use("/schedules/off-days", requireAuth, getOff);
router.use("/schedules/off-days", requireAuth, addOff);

router.use("/schedules", requireAuth, getUserSchedule);
router.use("/schedules", requireAuth, createSchedule);
router.use("/schedules", requireAuth, deleteSchedule);

module.exports = router;