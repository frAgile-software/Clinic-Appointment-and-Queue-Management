const express = require("express");
const router = express.Router();
const addPatientQueue = require("./queues/addPatientQueue");
const deleteQueue = require("./queues/deleteQueue");
const updateQueue = require("./queues/updateQueue");
const getQueue = require("./queues/getQueue");
const getQueueForPatient = require("./queues/getQueueForPatient");

const { requireAuth } = require('../middleware/auth');

router.use("/api/queues", requireAuth, getQueueForPatient);
router.use("/api/queues", requireAuth, addPatientQueue);
router.use("/api/queues", requireAuth, deleteQueue);
router.use("/api/queues", requireAuth, updateQueue);
router.use("/api/queues", requireAuth, getQueue);
router.use("/queues", addPatientQueue);

module.exports = router;