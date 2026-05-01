const express = require("express");
const router = express.Router();
const User = require("../../database/models/User");
const Queue = require("../../database/models/Queue");
const Staff = require("../../database/models/Staff");
const StaffSpeciality = require("../../database/models/StaffSpeciality");

const getBySpecialities = async (specialityIDs, clinic) => {
    const uniqueSpecs = [...new Set(specialityIDs)];

    const queue = await (uniqueSpecs.length === 0 ?
        Queue.find({ Clinic: clinic, options: { sort: { updatedAt: 1 } } }) :
        Queue.find({ Clinic: clinic, Speciality: { $in: uniqueSpecs }, options: { sort: { updatedAt: 1 } } })
    ).populate([{ path: "Speciality" }, {
        path: "User",
        select: "-auth0Id"
    }]);

    return queue;
};
const getByStaff = async (targetUserID, clinic) => {

    const targetStaffLink = await Staff.findOne({ User: targetUserID, Clinic: clinic });
    if (!targetStaffLink)
        return null;

    const specialities = await StaffSpeciality.find({ Staff: targetStaffLink });
    if (!specialities)
        return null;

    return getBySpecialities(specialities.map(spec => spec.Speciality), clinic);
};


router.get("/:clinicID", async (req, res) => {
    try {
        const { specialityIDs = [], auth0Id } = req.body;
        const { clinicID } = req.params;
        const { userID } = req.query;

        const callingUser = await User.findOne({ auth0Id: auth0Id });
        if (!callingUser)
            return res.status(403).json({ message: "Unauthorized." });

        const callingStaffLink = await Staff.findOne({ User: callingUser._id, Clinic: clinicID });
        if (!callingStaffLink)
            return res.status(403).json({ message: "Unauthorized." });


        const queue = userID !== undefined ? await getByStaff(userID, callingStaffLink.Clinic) : await getBySpecialities(specialityIDs, callingStaffLink.Clinic);

        if (queue === null)
            return res.status(404).json({ message: "Could not find staff member." });

        res.status(200).json(queue);

    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Server error."
        });
    }
});

module.exports = router;