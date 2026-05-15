const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const getNotif = require("./notifs/getNotifs");
const deleteSeen = require("./notifs/deleteSeen");
const createNotif = require("./notifs/createNotif");

router.use(requireAuth);

router.use("/api/notif", requireAuth, getNotif);
router.use("/api/notif", requireAuth, deleteSeen);
router.use("/api/notif", requireAuth, createNotif);

module.exports = router;          
