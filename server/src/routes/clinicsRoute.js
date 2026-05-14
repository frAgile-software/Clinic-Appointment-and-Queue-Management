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
const getAdmins = require("./clinics/getAdmins");

// 1. Specific API routes FIRST (This prevents the dashboard bug)
router.use("/api/clinics/assigned", requireAuth, listAssignedClinics);
router.use("/api/clinics/filters", getFilters);

// 2. Base API routes
router.use("/api/clinics", requireAuth, createClinic);
router.use("/api/clinics", requireAuth, updateClinic);
router.use("/api/clinics", requireAuth, removeStaff);
router.use("/api/clinics", requireAuth, listStaff);
router.use("/api/clinics", requireAuth, getAdmins);
router.use("/api/clinics", requireAuth, linkStaff);

// 3. Dynamic API routes LAST (Restored: This fixes your failing test!)
router.use("/api/clinics", requireAuth, filterClinics);
router.use("/api/clinics", requireAuth, getClinic);

// 4. Public / Non-API routes
router.use("/clinics/filters", getFilters);
router.use("/clinics", filterClinics);
router.use("/clinics", getClinic);

module.exports = router;