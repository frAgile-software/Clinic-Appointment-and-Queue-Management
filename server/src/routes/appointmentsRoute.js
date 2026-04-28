const express = require("express");
const router = express.Router();
const {requireAuth} = require("../middleware/auth");

const cancelAppointment = require("./appointments/cancelAppointment");

router.use("/api/appointments/", requireAuth, cancelAppointment);

module.exports = router;