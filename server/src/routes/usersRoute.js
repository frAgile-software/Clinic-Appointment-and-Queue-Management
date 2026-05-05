const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const registerUser = require("./users/registerUser");
const getUser = require("./users/getUser");
const updateUser = require("./users/updateUser");


router.use("/api/users/register", requireAuth, registerUser);
router.use("/api/users", requireAuth, updateUser);
router.use("/api/users", requireAuth, getUser);


module.exports = router;