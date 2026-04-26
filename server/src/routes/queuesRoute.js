const express = require("express");
const router = express.Router();

const addPatientQueue = require("./queues/addPatientQueue");
const updateQueue = require("./queues/updateQueue");

router.use("/api/queues/", addPatientQueue);
router.use("/api/queues", updateQueue);
router.use("/queues/", addPatientQueue);

module.exports = router;