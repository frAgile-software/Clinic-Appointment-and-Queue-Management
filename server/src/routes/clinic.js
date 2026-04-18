const express = require("express");
const router = express.Router();
const clinicInfo = require("./clinics/clinicInfo");
const listClinics = require("./clinics/listClinics");
const getClinic = require("./clinics/getClinic");
const createClinic = require("./clinics/createClinic");
const updateClinic = require("./clinics/updateClinic");
const listStaff = require("./clinics/listStaff");
const linkStaff = require("./clinics/linkStaff");

router.use("/clinics", getClinic);
router.use("/clinics", listClinics);

router.use("/api/clinic", getClinic); 
router.use("/api/clinic", createClinic);
router.use("/api/clinic", updateClinic);

router.use("/api/clinic/", listStaff);
router.use("/api/clinic", linkStaff);

module.exports = router;