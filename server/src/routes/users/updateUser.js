const express = require("express");
const User = require("../../database/models/User");
const router = express.Router();

router.patch("/:auth0Id", async (req,res) => {
    try {
        const { auth0Id } = req.params;
        const user = await User.findOne({auth0Id});

        if (!user) {
            return res.status(404).json({ message: "User does not exist."});
        }

        const updatedUser = await User.findOneAndUpdate(
            { auth0Id: auth0Id },
            { $set: req.body },
            { new: true, runValidators: true }
        );

        console.log("Updated user:", updatedUser);
        res.status(200).json({ message: "User updated.", user: updatedUser});

    } catch (error) {
        console.log('Error:', error);
        res.status(500).json({ message: "Server error." });
    }
});

module.exports = router;