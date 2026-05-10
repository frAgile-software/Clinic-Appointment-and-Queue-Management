const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");


const getByFilter = async (filter) => {
    console.log("Queues by filter...", filter);

    const queue = await Queue.find(filter)
        .sort({ updatedAt: 1 })
        .populate([
            { path: "Speciality" },
            { path: "Patient", select: "-auth0Id" }
        ]);

    return queue;
};
const getByStaff = async (targetUserID, filter) => {
    console.log("Queues by userId...");
    const targetStaffLink = await Staff.findOne({ User: targetUserID, Clinic: filter.Clinic });
    if (!targetStaffLink)
        return null;

    const specialities = await StaffSpeciality.find({ Staff: targetStaffLink._id });
    if (!specialities.length)
        return null;

    filter.Speciality = { $in: specialities.map(spec => spec.Speciality) }

    return getByFilter(filter);
};
const getByAuth0Id = async (targetAuth0Id, filter) => {
    console.log("Queues by auth0Id...");
    const targetStaff = await User.findOne({ auth0Id: targetAuth0Id });
    if (!targetStaff)
        return null;

    return getByStaff(targetStaff._id, filter);
};


router.get("/:clinicID", async (req, res) => {
    try {
        const { auth0Id, userId } = req.query;
        const specialityIDs = req.query.specialityIDs?.split(",") ?? [];
        const statuses = req.query.statuses?.split(",") ?? [];
        const { clinicID } = req.params;

        console.log("GET QUEUES\nIncoming payload:\nquery:", req.query, "params:", req.params);

        const callingUser = await User.findOne({ auth0Id: req.auth.payload.sub });
        if (!callingUser) {
            console.log("Calling user not found.");
            return res.status(403).json({ message: "Unauthorized." });
        }

        const callingStaffLink = await Staff.findOne({ User: callingUser._id, Clinic: clinicID });
        if (!callingStaffLink) {
            console.log("Calling user staff link not found.");
            return res.status(403).json({ message: "Unauthorized." });
        }

        let filter = { Clinic: clinicID };

        if (specialityIDs.length !== 0)
            filter = { ...filter, Speciality: { $in: specialityIDs } };

        if (statuses.length !== 0)
            filter = { ...filter, Status: { $in: statuses } };


        const queue = userId !== undefined ? await getByStaff(userId, filter)
            : auth0Id !== undefined ? await getByAuth0Id(auth0Id, filter)
                : await getByFilter(filter);

        if (queue === null) {
            console.log("Could not find staff member.");
            return res.status(404).json({ message: "Could not find staff member." });
        }

        res.status(200).json(queue);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

module.exports = router;