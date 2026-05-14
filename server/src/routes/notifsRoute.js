const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getNotif = require("./notifs/getNotifs");
const deleteSeen = require("./notifs/deleteSeen");

router.use("/api/notif", requireAuth, getNotif);
router.use("/api/notif", requireAuth, deleteSeen);

module.exports = router;          