const express = require("express");
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

const clinicInfo = require("./clinics/clinicInfo");
const listAssignedClinics = require("./clinics/listAssignedClinics");
const getClinic = require("./clinics/getClinic");
const createClinic = require("./clinics/createClinic");
const updateClinic = require("./clinics/updateClinic");
const listStaff = require("./clinics/listStaff");
const linkStaff = require("./clinics/linkStaff");
const filterClinics = require("./clinics/filterClinics");
const getFilters = require("./clinics/getFilters");
const removeStaff = require("./clinics/removeStaff");
const getAdmins = require("./clinics/getAdmins"); //gets admins

// API routes - specific routes first
router.use("/api/clinics/assigned", requireAuth, listAssignedClinics);
router.use("/api/clinics/filters", getFilters);

// Other API clinic routes
router.use("/api/clinics", requireAuth, createClinic);
router.use("/api/clinics", requireAuth, updateClinic);
router.use("/api/clinics", requireAuth, removeStaff);
router.use("/api/clinics", requireAuth, listStaff);
router.use("/api/clinics", requireAuth, getAdmins);
router.use("/api/clinics", requireAuth, linkStaff);

// Dynamic clinic route last
router.use("/api/clinics", requireAuth, filterClinics);
router.use("/api/clinics", requireAuth, getClinic);

router.use("/clinics/filters", getFilters);
router.use("/clinics", filterClinics);
router.use("/clinics", getClinic);

module.exports = router;