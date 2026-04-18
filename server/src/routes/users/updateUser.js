const express = require("express");
const User = require("../../database/models/User");
const router = express.Router();
module.exports = router;

router.patch("/:auth0Id", async (req,res) => {
    try {
        const { auth0Id } = res.params;
        const user = await User.findOne({auth0Id});

        if (!user) {
            return res.status(404).json({ message: "User does not exist."});
        }

        const updatedUser = await User.findOneAndUpdate(
            { auth0Id: auth0Id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "User updated.", user: updatedUser});

    } catch (error) {
        res.status(500).json({ message: "Server error." });
    }
});