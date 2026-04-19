const express = require("express");
const router = express.Router();
const Clinic = require('../../database/models/Clinic');

router.get("/", async (req, res) => {
    try {
        const { province, town, suburb, type } = req.query;

        const match = {
            ...(province && { province: { $regex: province, $options: "i"}}),
            ...(town && { physicalTown: { $regex: town, $options: "i"}}),
            ...(suburb && { physicalSuburb: { $regex: suburb, $options: "i"}}),
            ...(type && { practiceTypeDescription: { $regex: type, $options: "i"}}),
        };

        const [provinces, towns, suburbs, types] = await Promise.all([
            Clinic.distinct("province", match),
            Clinic.distinct("physicalTown", match),
            Clinic.distinct("physicalSuburb", match),
            Clinic.distinct("practiceTypeDescription", match),
        ]);

        res.status(200).json({
            provinces: provinces.filter(Boolean).sort(),
            towns: towns.filter(Boolean).sort(),
            suburbs: suburbs.filter(Boolean).sort(),
            types: types.filter(Boolean).sort(),
        });

    } catch (error) {
        console.error("Error fetching filter options:", error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;