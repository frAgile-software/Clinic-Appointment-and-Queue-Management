const express = require("express");
const router = express.Router();
const updateAppointment = require("./appointments/updateAppointment");
const cancelAppointment = require("./appointments/cancelAppointment");

router.use("/api/appointments", updateAppointment);
router.use("/api/appointments", cancelAppointment);

module.exports = router;