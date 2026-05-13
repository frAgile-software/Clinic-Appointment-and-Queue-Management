const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const updateAppointment = require("./appointments/updateAppointment");
const cancelAppointment = require("./appointments/cancelAppointment");
const getAppointments = require("./appointments/getAppointments");
const createAppointment = require("./appointments/createAppointment");
const AppointmentStats = require("./appointments/getAppointmentStats");

router.use("/api/appointments/statistics", requireAuth, AppointmentStats);

router.use("/api/appointments", requireAuth, createAppointment);
router.use("/api/appointments", requireAuth, updateAppointment);
router.use("/api/appointments", requireAuth, cancelAppointment);
router.use("/api/appointments", requireAuth, getAppointments);

module.exports = router;