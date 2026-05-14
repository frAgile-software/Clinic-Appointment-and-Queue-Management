const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getNotifs = require("./notifs/getNotifs");
const deleteSeen = require("./notifs/deleteSeen");

router.use("/api/notifs", requireAuth, getNotifs);
router.use("/api/notifs", requireAuth, deleteSeen);

module.exports = router;          