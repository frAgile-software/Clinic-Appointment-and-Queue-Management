const express = require("express");
const router = express.Router();
const {requireAuth} = require("../middleware/auth");

const addPatientQueue = require("./queues/addPatientQueue");

router.use("/api/queues/", requireAuth, addPatientQueue);
router.use("/queues/", addPatientQueue);

module.exports = router;