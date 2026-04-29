const express = require("express");
const router = express.Router();
const Clinic = require('../../database/models/Clinic');

const SORT_FIELDS = ["practiceName", "province", "physicalSuburb", "physicalTown", "practiceTypeDescription"];

router.get("/", async (req, res) => {
    try {
        const {
            _page = 1,
            _page_len = 10,
            _orderby = "practiceName",
            _order = "asc",

            name,
            province,
            town,
            suburb,
            type,
            service,

        } = req.query;

        const page = parseInt(_page);
        const pageLen = parseInt(_page_len);
        const skip = (page-1)*pageLen;

        const sortField = SORT_FIELDS.includes(_orderby) ? _orderby : "practiceName";
        const sortOrder = _order === "asc" ? 1 : -1;

        const pipeline = [
            {
                $match: {
                    ...(name && { practiceName: {$regex: name, $options: "i"}}),
                    ...(province && { province: { $regex: province, $options: "i"}}),
                    ...(town && { physicalTown: {$regex: town, $options: "i"}}),
                    ...(suburb && { physicalSuburb: { $regex: suburb, $options: "i"}}),
                    ...(type && { practiceTypeDescription: {$regex: type, $options: "i"}}),
                },
            },
            {
                $lookup: {
                    from: "staffs", 
                    localField: "_id",
                    foreignField: "Clinic",
                    as: "staffUsers",
                },
            },
            {
                $lookup: {
                    from: "staffspecialities",
                    localField: "staffUsers._id",
                    foreignField: "Staff",
                    as: "clinicServiceLinks",
                },
            },
            {
                $lookup: {
                    from: "specialities",
                    localField: "clinicServiceLinks.Speciality",
                    foreignField: "_id",
                    as: "services",
                },
            },
            ...(service ? [{ $match: { "services.SpecialityName": service } }] : []),
            {
                $project: { 
                    staffLinks: 0,
                    staffUsers: 0,
                    clinicServiceLinks: 0,
                },
            },
        ];

        const [clinics, countResult] = await Promise.all([
            Clinic.aggregate([
                ...pipeline,
                { $sort: { [sortField]: sortOrder } },
                { $skip: skip },
                { $limit: pageLen },
            ]),
            Clinic.aggregate([...pipeline, { $count: "total" }]),
        ]);

        const total = countResult[0]?.total ?? 0;

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