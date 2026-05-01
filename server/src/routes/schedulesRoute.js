const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const  updateSchedule = require('./schedules/updateSchedule');
const  getUserSchedule = require('./schedules/getUserSchedule');

router.use("/api/schedules", requireAuth, updateSchedule);
router.use("/api/users", requireAuth, getUserSchedule);

module.exports = router;