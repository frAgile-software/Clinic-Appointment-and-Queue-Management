const mongoose = require('mongoose');
const Clinic = require('./src/database/models/Clinic');
const User = require('./src/database/models/User');
const Staff = require('./src/database/models/Staff');

const seedMockStaff = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is not defined in your .env file");

        await mongoose.connect(uri, { dbName: 'test' });
        console.log("✅ Connected successfully to the 'test' database.");

        // --- CLEANUP STEP ---
        // 1. Drop the Staff collection to eradicate any lingering/ghost indexes
        try {
            await Staff.collection.drop();
            console.log("🧹 Cleared old Staff collection and ghost indexes.");
        } catch (err) {
            // Ignore if the collection doesn't exist yet
        }

        // 2. Delete previously generated mock users to prevent duplicate email/auth0Id errors
        const deletedUsers = await User.deleteMany({ email: { $regex: '@example.com' } });
        console.log(`🧹 Cleared ${deletedUsers.deletedCount} old mock users.`);
        // --------------------

        const clinics = await Clinic.aggregate([{ $sample: { size: 2 } }]);
        
        if (clinics.length < 2) {
            console.log("❌ Not enough clinics found. Please ensure at least 2 clinics exist in the test DB.");
            process.exit(1);
        }
        console.log(`🏥 Found ${clinics.length} random clinics to assign staff to.`);

        const mockUsersData = [];

        // Generate 1 Admin and 5 Staff for Clinic 1
        mockUsersData.push({ 
            name: "Alice", surname: "Admin", email: "admin1@example.com", auth0Id: "auth0|mock_admin_1", role: "Admin" 
        });
        for (let i = 1; i <= 5; i++) {
            mockUsersData.push({ 
                name: "Nurse", surname: `Alpha${i}`, email: `staff${i}.clinic1@example.com`, auth0Id: `auth0|mock_staff_c1_${i}`, role: "Staff" 
            });
        }

        // Generate 1 Admin and 5 Staff for Clinic 2
        mockUsersData.push({ 
            name: "Bob", surname: "Admin", email: "admin2@example.com", auth0Id: "auth0|mock_admin_2", role: "Admin" 
        });
        for (let i = 1; i <= 5; i++) {
            mockUsersData.push({ 
                name: "Doctor", surname: `Beta${i}`, email: `staff${i}.clinic2@example.com`, auth0Id: `auth0|mock_staff_c2_${i}`, role: "Staff" 
            });
        }

        const createdUsers = await User.insertMany(mockUsersData);
        console.log(`👤 Created ${createdUsers.length} mock users (10 Staff, 2 Admins).`);

        const staffLinks = [];

        // Map the first 6 users to Clinic 1
        for (let i = 0; i < 6; i++) {
            staffLinks.push({ User: createdUsers[i]._id, Clinic: clinics[0]._id });
        }

        // Map the remaining 6 users to Clinic 2
        for (let i = 6; i < 12; i++) {
            staffLinks.push({ User: createdUsers[i]._id, Clinic: clinics[1]._id });
        }

        const createdStaff = await Staff.insertMany(staffLinks);
        console.log(`🔗 Created ${createdStaff.length} Staff-Clinic relational links.`);

        console.log("✅ Mock data generation complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error generating mock data:", error);
        process.exit(1);
    }
};

seedMockStaff();