const cron = require("node-cron");
const Queue = require("../database/models/Queue");

const clearStaleQueues = async () => {
    try {
        const result = await Queue.deleteMany({
            Status: { $in: ["Waiting"] }, // could maybe also add "In Consult"
        });
        console.log(`[clearStaleQueues] Deleted ${result.deletedCount} stale queues at ${new Date().toISOString()}`)
    } catch (error) {
        console.error("[clearStaleQueues] Error:", error);
    }
}

const scheduleClearStaleQueues = () => {
    // set to run at 03:00 server time
    cron.schedule(`0 3 * * *`, clearStaleQueues, {
        timezone: 'Africa/Johannesburg',
    });
    console.log("[clearStaleQueues] Scheduled daily at 03:00 Africa/Johannesburg");
}

module.exports = {scheduleClearStaleQueues, clearStaleQueues};