const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");
const Speciality = require("../../database/models/Speciality");

router.get("/clinic/:clinicId", async (req, res) => {
  try {
    const { clinicId } = req.params;

    if (!mongoose.isValidObjectId(clinicId)) {
        return res.status(400).json({ error: "Invalid clinic ID" });
    }

    // Find all staff at this clinic
    const staffAtClinic = await Staff.find({ Clinic: clinicId }).select('_id');
    const staffIds = staffAtClinic.map(s => s._id);

    // Find all StaffSpeciality records for those staff, populated with speciality and spec name
    const staffSpecialities = await StaffSpeciality
      .find({ Staff: { $in: staffIds } })
      .populate('Speciality', 'SpecialityName')
      .lean();

    const specialities = {};
    for (const ss of staffSpecialities) {
      if (ss.Speciality) {
        specialities[ss.Speciality._id] = ss.Speciality.SpecialityName;
      }
    }

    res.status(200).json(specialities);
  } catch (error) {
    console.error("Error fetching specialities: ", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;