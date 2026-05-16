const express = require("express");
const router = express.Router();

const Speciality = require("../../database/models/Speciality");
router.get("/", async (req, res) => {
    try {
        const specialities = await Speciality.find().sort({ SpecialityName: 1 });
        return res.status(200).json(specialities);
    } catch (error) {
        console.error("Error fetching specialities:", error);
        return res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;