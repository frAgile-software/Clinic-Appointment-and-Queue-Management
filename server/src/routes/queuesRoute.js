const express = require("express");
const router = express.Router();

const addPatientQueue = require("./queues/addPatientQueue");

router.use("/api/queues/", addPatientQueue);
router.use("/queues/", addPatientQueue);

module.exports = router;