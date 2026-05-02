const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const addSpecialityToStaff = require("./specialities/addSpecialityToStaff");

router.use("/api/specialities", requireAuth, addSpecialityToStaff);

module.exports = router;