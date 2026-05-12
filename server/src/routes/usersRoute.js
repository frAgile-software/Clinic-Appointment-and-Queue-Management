const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const registerUser = require("./users/registerUser");
const getUser = require("./users/getUser");
const updateUser = require("./users/updateUser");
const getByEmail = require('./users/getByEmail');


router.use("/api/users/register", requireAuth, registerUser);
router.use("/api/users", requireAuth, updateUser);
router.use("/api/users", requireAuth, getUser);
router.use("/api/users", requireAuth, getByEmail);


module.exports = router;