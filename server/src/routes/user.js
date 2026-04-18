const express = require("express");
const router = express.Router();
const registerUser = require("./user/registerUser");
const getUser = require("./user/getUser");
const updateUser = require("./user/updateUser");

router.use("/api/register", registerUser);
router.use("/api/user", getUser);
router.use("/api/user", updateUser);

module.exports = router;