const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const Queue = require("../../database/models/Queue");
router.delete("/:queueId", async (req, res) => {
    try {
        const { queueId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(queueId)) {
            return res.status(400).json({ error: "Invalid queue ID" });
        }
        const queueEntry = await Queue.findByIdAndDelete(queueId);
        if (!queueEntry) {
            return res.status(404).json({ error: "Queue entry not found" });
        }
        return res.status(200).json({
            message: "Queue entry deleted successfully.",
            queueEntry: queueEntry
        });
    } catch (error) {
        console.error("Error deleting queue entry:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
