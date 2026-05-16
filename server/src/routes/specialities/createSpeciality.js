const express = require("express");
const router = express.Router();

const Speciality = require("../../database/models/Speciality");

// POST /api/specialities
router.post("/", async (req, res) => {
    try {
        const { SpecialityName } = req.body;
        if (!SpecialityName || SpecialityName.trim() === "") {
            return res.status(400).json({
                message: "Speciality name is required."
            });
        }

        const cleanedName = SpecialityName.trim();//remove leading/trailing whitespace

        const existingSpeciality = await Speciality.findOne({//check if speciality already exists (case-insensitive)
            SpecialityName: {
                $regex: `^${cleanedName}$`,
                $options: "i"
            }
        });

        if (existingSpeciality) {
            return res.status(409).json({
                message: "Speciality already exists."
            });
        }

        const speciality = await Speciality.create({
            SpecialityName: cleanedName
        });

        return res.status(201).json({
            message: "Speciality created successfully.",
            speciality
        });

    } catch (error) {
        console.error("Error creating speciality:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;