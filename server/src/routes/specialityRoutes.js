const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth");

const addSpecialityToStaff = require("./specialities/addSpecialityToStaff");
const removeSpecialityFromStaff = require("./specialities/removeSpecialityFromStaff");

router.use("/api/specialities", requireAuth, addSpecialityToStaff);
router.use("/api/specialities", requireAuth, removeSpecialityFromStaff);

module.exports = router;