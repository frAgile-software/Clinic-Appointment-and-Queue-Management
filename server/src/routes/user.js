const express = require("express");
const router = express.Router();
const registerUser = require("./user/registerUser");
const getUser = require("./user/getUser");

router.use("/api/register", registerUser);
router.use("/api/user", getUser);

module.exports = router;