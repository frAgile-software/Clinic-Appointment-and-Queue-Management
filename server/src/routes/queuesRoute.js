const express = require("express");
const router = express.Router();
const addPatientQueue = require("./queues/addPatientQueue");
const deleteQueue = require("./queues/deleteQueue");

router.use("/api/queues/", addPatientQueue);
router.use("/api/queues", deleteQueue);
router.use("/queues/", addPatientQueue);


module.exports = router;