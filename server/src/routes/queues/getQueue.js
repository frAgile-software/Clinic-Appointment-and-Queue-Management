const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

const getByClinic = async (clinic) => {
    console.log("Queues by clinic...", clinic);

    const filter = { Clinic: clinic };

    const queue = await Queue.find(filter)
        .sort({ updatedAt: 1 })
        .populate([
            { path: "Speciality" },
            { path: "Patient", select: "-auth0Id" }
        ]);

    return queue;
};
const getBySpecialities = async (specialityIDs, clinic) => {
    console.log("Queues by specialities...", specialityIDs, clinic);

    const uniqueSpecs = [...new Set(specialityIDs)];

    const filter = uniqueSpecs.length === 0
        ? { Clinic: clinic }
        : { Clinic: clinic, Speciality: { $in: uniqueSpecs } };

    const queue = await Queue.find(filter)
        .sort({ updatedAt: 1 })
        .populate([
            { path: "Speciality" },
            { path: "Patient", select: "-auth0Id" }
        ]);

    return queue;
};
const getByStaff = async (targetUserID, clinic) => {
    console.log("Queues by userId...");
    const targetStaffLink = await Staff.findOne({ User: targetUserID, Clinic: clinic });
    if (!targetStaffLink) {
        return null;
    }

    const specialities = await StaffSpeciality.find({ Staff: targetStaffLink._id });
    if (!specialities.length) {
        return null;
    }

    return getBySpecialities(specialities.map(spec => spec.Speciality), clinic);
};
const getByAuth0Id = async (targetAuth0Id, clinic) => {
    console.log("Queues by auth0Id...");
    const targetStaff = await User.findOne({auth0Id: targetAuth0Id });
    if (!targetStaff) {
        return null;
    }

    return getByStaff(targetStaff._id, clinic);
};


router.get("/:clinicID", async (req, res) => {
    try {
        const { auth0Id, userId } = req.query;
        const specialityIDs = req.query.specialityIDs?.split(",") ?? [];
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

        const queue = userId !== undefined ? await getByStaff(userId, clinicID) 
                    : auth0Id !== undefined ? await getByAuth0Id(auth0Id, clinicID) 
                    : specialityIDs?.length ? await getBySpecialities(specialityIDs, clinicID)
                    : await getByClinic(clinicID);

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