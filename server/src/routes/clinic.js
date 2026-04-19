const express = require("express");
const router = express.Router();
const clinicInfo = require("./clinic/clinicInfo");
const listClinics = require("./clinic/listClinics");
const getClinic = require("./clinic/getClinic");
const createClinic = require("./clinic/createClinic");
const updateClinic = require("./clinic/updateClinic");
const listStaff = require("./clinic/listStaff");
const linkStaff = require("./clinic/linkStaff");

router.use("/clinics", getClinic);
router.use("/api/clinics", listClinics);

router.use("/api/clinic", getClinic); 
router.use("/api/clinic", createClinic);
router.use("/api/clinic", updateClinic);

router.use("/api/clinic/", listStaff);
router.use("/api/clinic", linkStaff);

module.exports = router;