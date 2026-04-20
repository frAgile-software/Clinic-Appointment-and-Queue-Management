const mongoose = require("mongoose");

const dbConnect = async () => {
    let attempt = 0;
    const maxAttempts = 3;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    while (attempt < maxAttempts) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log("Database connected successfully");
            break;
        } catch (error) {
            attempt += 1;
            console.error("Database connection failed:", error);
            if (attempt >= maxAttempts) {
                const errorMsg = `MongoDB connection failed after ${maxAttempts} attempts. Check the MONGODB_URI env. variable and network connectivity.`;
                console.error(errorMsg);
                throw new Error(errorMsg); // insert spiderman returning grenade gif here
            }
            console.log(`Retry #${attempt} in 3s...`);
            await delay(3000);
        }
    }
};

module.exports = dbConnect;