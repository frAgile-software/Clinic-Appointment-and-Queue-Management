const express = require("express");
const router = express.Router();
const registerUser = require("./users/registerUser");
const getUser = require("./users/getUser");
const updateUser = require("./users/updateUser");
const getUserSchedule = require("./users/getUserSchedule");

router.use("/api/users/register", registerUser);
router.use("/api/users", getUserSchedule);
router.use("/api/users", updateUser);
router.use("/api/users", getUser);

module.exports = router;