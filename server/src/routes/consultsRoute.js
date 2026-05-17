const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getConsults = require("./consults/getConsults");

router.use("/api/consults", requireAuth, getConsults);

module.exports = router;