const mongoose = require("mongoose");

const dbConnect = async () => {
    try {
        // INJECT THIS LINE:
         
        
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
    }
};

module.exports = dbConnect;