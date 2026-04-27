require('dotenv').config();
const mongoose = require('mongoose');

// Import all required models
const Clinic = require('./src/database/models/Clinic');
const User = require('./src/database/models/User');
const Staff = require('./src/database/models/Staff');
const Speciality = require('./src/database/models/Speciality');
const StaffSpeciality = require('./src/database/models/StaffSpeciality');
const Schedule = require('./src/database/models/Schedule');

const seedMockData = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is not defined in your .env file");

        await mongoose.connect(uri, { dbName: 'test' });
        console.log("✅ Connected successfully to the 'test' database.");
        
        console.log("➕ Running in ADDITIVE mode. No existing data will be deleted.");

        // Generate a unique ID for this specific run to prevent duplicate email/auth0Id errors
        const runId = Date.now().toString().slice(-5);

        // --- FETCH OR CREATE CLINICS ---
        let clinics = await Clinic.aggregate([{ $sample: { size: 2 } }]);
        
        if (clinics.length < 2) {
            console.log("⚠️ Less than 2 clinics found. Creating dummy clinics...");
            const newClinics = await Clinic.insertMany([
                { province: "GAUTENG", physicalTown: "JOHANNESBURG", physicalSuburb: "PARKTOWN", physicalAddress: "1 Park Road", practiceName: `Parktown Medical ${runId}`, practiceType: "GP", practiceTypeDescription: "General Practice", practiceNumber: `PR${runId}1`, contactNumber: "0111234567" },
                { province: "WESTERN CAPE", physicalTown: "CAPE TOWN", physicalSuburb: "SEA POINT", physicalAddress: "2 Ocean Drive", practiceName: `Sea Point Health ${runId}`, practiceType: "SPEC", practiceTypeDescription: "Specialist Clinic", practiceNumber: `PR${runId}2`, contactNumber: "0219876543" }
            ]);
            clinics = newClinics;
        }
        console.log(`🏥 Using 2 random clinics for this seed run.`);

        // --- CREATE SPECIALITIES ---
        const specialtyDocs = await Speciality.insertMany([
            { SpecialityName: `General Checkup (${runId})` },
            { SpecialityName: `Maternity (${runId})` },
            { SpecialityName: `Cardiology (${runId})` },
            { SpecialityName: `Dentistry (${runId})` }
        ]);
        console.log(`🩺 Created ${specialtyDocs.length} new Specialities.`);

        // --- CREATE USERS (Staff & Patients) ---
        const mockUsersData = [];

        // 2 Patients for testing
        mockUsersData.push({ name: "John", surname: "Doe", email: `patient1_${runId}@example.com`, auth0Id: `auth0|mock_pat_1_${runId}`, role: "Patient" });
        mockUsersData.push({ name: "Jane", surname: "Smith", email: `patient2_${runId}@example.com`, auth0Id: `auth0|mock_pat_2_${runId}`, role: "Patient" });

        // 2 Staff for Clinic 1
        mockUsersData.push({ name: "Dr. Alice", surname: "Alpha", email: `staff1.c1_${runId}@example.com`, auth0Id: `auth0|mock_staff_c1_1_${runId}`, role: "Staff" });
        mockUsersData.push({ name: "Dr. Bob", surname: "Beta", email: `staff2.c1_${runId}@example.com`, auth0Id: `auth0|mock_staff_c1_2_${runId}`, role: "Staff" });

        // 2 Staff for Clinic 2
        mockUsersData.push({ name: "Dr. Charlie", surname: "Gamma", email: `staff1.c2_${runId}@example.com`, auth0Id: `auth0|mock_staff_c2_1_${runId}`, role: "Staff" });
        mockUsersData.push({ name: "Dr. Diana", surname: "Delta", email: `staff2.c2_${runId}@example.com`, auth0Id: `auth0|mock_staff_c2_2_${runId}`, role: "Staff" });

        const createdUsers = await User.insertMany(mockUsersData);
        console.log(`👤 Created ${createdUsers.length} new mock users.`);

        // Isolate just the staff users
        const staffUsers = createdUsers.slice(2, 6);

        // --- LINK STAFF TO CLINICS & SPECIALITIES ---
        const staffLinks = [];
        const staffSpecialityLinks = [];
        const scheduleLinks = [];

        staffUsers.forEach((user, index) => {
            const clinicIndex = index < 2 ? 0 : 1;
            const clinicId = clinics[clinicIndex]._id;
            
            const spec1 = specialtyDocs[index % specialtyDocs.length]._id;
            const spec2 = specialtyDocs[(index + 1) % specialtyDocs.length]._id;

            staffLinks.push({ User: user._id, Clinic: clinicId });
            staffSpecialityLinks.push({ Staff: user._id, Speciality: spec1 }); 
            staffSpecialityLinks.push({ Staff: user._id, Speciality: spec2 });

            for (let day = 1; day <= 5; day++) {
                scheduleLinks.push({
                    Staff: user._id, 
                    DayOfWeek: day,
                    StartTime: "08:00",
                    EndTime: "17:00"
                });
            }
        });

        const createdStaff = await Staff.insertMany(staffLinks);
        console.log(`🔗 Created ${createdStaff.length} new Staff-Clinic relational links.`);

        const mappedStaffSpecialities = staffSpecialityLinks.map(link => {
            const correctStaffDoc = createdStaff.find(s => s.User.toString() === link.Staff.toString());
            return {
                Staff: correctStaffDoc._id,
                Speciality: link.Speciality
            };
        });

        await StaffSpeciality.insertMany(mappedStaffSpecialities);
        console.log(`⚕️ Assigned specialties to the new staff members.`);

        await Schedule.insertMany(scheduleLinks);
        console.log(`📅 Created ${scheduleLinks.length} new schedule entries.`);

        console.log("✅ Safe additive mock data generation complete!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error generating mock data:", error);
        process.exit(1);
    }
};

seedMockData();