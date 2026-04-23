const mongoose = require('mongoose');
const Clinic = require('./src/database/models/Clinic');
const User = require('./src/database/models/User');
const Staff = require('./src/database/models/Staff');

const assignSpecificUser = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is not defined in your .env file");

        await mongoose.connect(uri, { dbName: 'test' });
        console.log("✅ Connected successfully to the 'test' database.");

        // 1. Find Bruno and force his role to "Staff" (Upsert creates him if he's missing)
        const targetEmail = "2813088@students.wits.ac.za";
        
        let user = await User.findOneAndUpdate(
            { email: targetEmail },
            { 
                $set: { 
                    auth0Id: "google-oauth2|117838973675363623458",
                    name: "Bruno",
                    surname: "Faria",
                    title: "Mr",
                    role: "Staff" // Forcing the role change here
                } 
            },
            { new: true, upsert: true } 
        );

        console.log(`👤 Processed User: ${user.name} ${user.surname}. Role is securely set to: ${user.role}`);

        // 2. Fetch 2 random clinics
        const clinics = await Clinic.aggregate([{ $sample: { size: 2 } }]);
        
        if (clinics.length < 2) {
            console.log("❌ Not enough clinics found in the test DB.");
            process.exit(1);
        }
        console.log(`🏥 Selected Clinics: \n 1. ${clinics[0].practiceName} \n 2. ${clinics[1].practiceName}`);

        // 3. Prevent duplicate key errors by wiping any existing links for Bruno first
        const deletedLinks = await Staff.deleteMany({ User: user._id });
        if (deletedLinks.deletedCount > 0) {
            console.log(`🧹 Cleared ${deletedLinks.deletedCount} old clinic assignments for this user.`);
        }

        // 4. Create the new Staff links
        const staffLinks = [
            { User: user._id, Clinic: clinics[0]._id },
            { User: user._id, Clinic: clinics[1]._id }
        ];

        const createdStaff = await Staff.insertMany(staffLinks);
        console.log(`🔗 Successfully created ${createdStaff.length} new Staff-Clinic relational links!`);

        console.log("✅ Operation complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error assigning user:", error);
        process.exit(1);
    }
};

assignSpecificUser();