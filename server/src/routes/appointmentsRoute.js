const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const updateAppointment = require("./appointments/updateAppointment");
const cancelAppointment = require("./appointments/cancelAppointment");

router.use("/api/appointments", requireAuth, updateAppointment);
router.use("/api/appointments", requireAuth,  cancelAppointment);

module.exports = router;