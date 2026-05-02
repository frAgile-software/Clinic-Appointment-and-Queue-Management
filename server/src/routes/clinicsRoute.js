const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const clinicInfo = require("./clinics/clinicInfo");
const listAssignedClinics = require("./clinics/listAssignedClinics");
const getAssignedClinic = require("./clinics/getAssignedClinic");
const getClinic = require("./clinics/getClinic");
const createClinic = require("./clinics/createClinic");
const updateClinic = require("./clinics/updateClinic");
const listStaff = require("./clinics/listStaff");
const linkStaff = require("./clinics/linkStaff");
const filterClinics = require("./clinics/filterClinics");
const getFilters = require("./clinics/getFilters");

router.use("/clinics/filters", getFilters);
router.use("/clinics", filterClinics);
router.use("/clinics", getClinic);

// API routes - specific routes first
router.use("/api/clinics/assigned", requireAuth, getAssignedClinic);
//router.use("/api/clinics/assigned", requireAuth, listAssignedClinics);

// Other API clinic routes
router.use("/api/clinics", requireAuth, createClinic);
router.use("/api/clinics", requireAuth, updateClinic);
router.use("/api/clinics", requireAuth, listStaff);
router.use("/api/clinics", requireAuth, linkStaff);
router.use("/api/clinics", requireAuth, filterClinics);

// Dynamic clinic route last
router.use("/api/clinics", requireAuth, getClinic);

module.exports = router;