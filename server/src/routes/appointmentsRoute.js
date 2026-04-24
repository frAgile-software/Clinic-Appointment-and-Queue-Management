const express = require("express");
const router = express.Router();
const updateAppointment = require("./appointments/updateAppointment");

router.use("/api/appointments", updateAppointment);

module.exports = router;