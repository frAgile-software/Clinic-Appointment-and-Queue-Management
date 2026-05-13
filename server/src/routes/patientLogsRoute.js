const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getPatientLogs = require("./patientLogs/getPatientLogs");

router.use("/api/patientLogs", requireAuth, getPatientLogs);

module.exports = router;