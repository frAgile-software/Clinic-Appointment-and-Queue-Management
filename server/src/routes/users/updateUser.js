const express = require("express");
const User = require("../../database/models/User");
const router = express.Router();

async function updateAuth0Email(auth0Id, newEmail) {
    const token = await getAuth0ManagementToken();

    const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/api/v2/users/${encodeURIComponent(auth0Id)}`,{
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            email: newEmail,
            email_verified: false,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        console.error("Update Auth0 Email error:", error);
        throw new Error(error.message || "Failed to update email in Auth0.");
    }

    return await response.json();
}

router.patch("/:auth0Id", async (req,res) => {
    try {
        const { auth0Id } = req.params;
        const user = await User.findOne({auth0Id});

        if (!user) {
            return res.status(404).json({ message: "User does not exist."});
        }

        if (req.body.email) {
            await updateAuth0Email(auth0Id, req.body.email);
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