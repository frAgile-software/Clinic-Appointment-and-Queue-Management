const express = require("express");
const router = express.Router();

const clinicInfo = require("./clinics/clinicInfo");
const listAssignedClinics = require("./clinics/listAssignedClinics");
const getClinic = require("./clinics/getClinic");
const createClinic = require("./clinics/createClinic");
const updateClinic = require("./clinics/updateClinic");
const listStaff = require("./clinics/listStaff");
const linkStaff = require("./clinics/linkStaff");
const filterClinics = require("./clinics/filterClinics");

// Non-API routes
router.use("/clinics", filterClinics);
router.use("/clinics", getClinic);

// API routes - specific routes first
router.use("/api/clinics/assigned", listAssignedClinics);

// Other API clinic routes
router.use("/api/clinics", createClinic);
router.use("/api/clinics", updateClinic);
router.use("/api/clinics", listStaff);
router.use("/api/clinics", linkStaff);
router.use("/api/clinics", filterClinics);

// Dynamic clinic route last
router.use("/api/clinics", getClinic);

module.exports = router;