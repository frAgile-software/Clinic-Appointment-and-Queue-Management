const express = require("express");
const router = express.Router();
const Clinic = require('../../database/models/Clinic');

const SORT_FIELDS = ["practiceName", "practiceProvince", "practiceSuburb", "practiceTown", "practiceType"] 

router.get("/", async (req, res) => {
    try {
        const {
            _page = 1,
            _page_len = 10,
            _orderby = "practiceName",
            _order = "asc",

            //filters
            name,
            province,
            town,
            suburb,
            type,

        } = req.query;

        const page = parseInt(_page);
        const pagelen = parseInt(_page_len);
        const skip = (page-1)*pagelen;

        const sortField = SORT_FIELDS.includes(_orderby) ? _orderby : "practiceName";
        const sortOrder = _order === "asc" ? 1 : -1;

        const filter = {};

        if (name) filter.practiceName =             { $regex: name,     $options: "i"};
        if (province) filter.practiceProvince =     { $regex: province, $options: "i"};
        if (town) filter.practiceTown =             { $regex: town,     $options: "i"};
        if (suburb) filter.practiceSuburb =         { $regex: suburb,   $options: "i"};
        if (type) filter.practiceType =             { $regex: type,     $options: "i"};

        const [clinics, total] = await Promise.all([
            Clinic.find(filter)
                .sort({[sortField]: sortOrder})
                .skip(skip)
                .limit(pagelen),
            Clinic.countDocuments(filter),
        ])

        res.status(200).json({
            data: clinics,
            pagination: {
                total,
                page,
                pageLen,
                totalPages: Math.ceil(total/pageLen),
            },
        });

    } catch (error) {
        console.log("Error filtering clinics: ", error)
        res.status(500).json({ message: "Server error."});
    };
});

module.exports = router;
