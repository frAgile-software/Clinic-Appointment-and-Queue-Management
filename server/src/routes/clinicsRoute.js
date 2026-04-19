const express = require("express");
const router = express.Router();
const clinicInfo = require("./clinics/clinicInfo");
const listAssignedClinics = require("./clinics/listAssignedClinics");
const getClinic = require("./clinics/getClinic");
const createClinic = require("./clinics/createClinic");
const updateClinic = require("./clinics/updateClinic");
const listStaff = require("./clinics/listStaff");
const linkStaff = require("./clinics/linkStaff");

router.use("/clinics", getClinic);
router.use("/api/clinics/assigned", listAssignedClinics);

router.use("/api/clinics", getClinic); 
router.use("/api/clinics", createClinic);
router.use("/api/clinics", updateClinic);

router.use("/api/clinics", listStaff);
router.use("/api/clinics", linkStaff);

module.exports = router;