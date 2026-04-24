const express = require("express");
const router = express.Router();
const updateAppointment = require("./users/updateAppointment");
// const funkyFunc = require("./appointments/funcName");

// router.use("/api/appointments/...", funkyFunc);
router.use("/api/appointments", updateAppointment);

module.exports = router;