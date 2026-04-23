const express = require("express");
const router = express.Router();

const cancelAppointment = require("./appointments/cancelAppointment");

router.use("/api/appointments/", cancelAppointment);

module.exports = router;