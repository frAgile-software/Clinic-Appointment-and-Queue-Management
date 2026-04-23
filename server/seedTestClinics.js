const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Clinic = require('./src/database/models/Clinic');

const filePath = process.argv[2];

if (!filePath) {
    console.error("❌ Please provide the path to the CSV file.");
    process.exit(1);
}

const seedTestDatabase = async () => {
    try {
        // 1. Grab the URI but FORCE the database name to 'test'
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error("MONGODB_URI is not defined in your .env file");

        await mongoose.connect(uri, { dbName: 'test' });
        console.log("✅ Connected successfully to the 'test' database.");

        const clinics = [];

        // 2. Stream and parse the CSV
        fs.createReadStream(filePath)
            .pipe(csv({ skipLines: 1 }))
            .on('data', (row) => {
                if (row['PRACTICE NAME']) { 
                    clinics.push({
                        province: row['PROVINCE'],
                        physicalTown: row['PHYSICAL TOWN'],
                        physicalSuburb: row['PHYSICAL SUBURB'],
                        physicalAddress: row['PHYSICAL ADDRESS'],
                        practiceName: row['PRACTICE NAME'],
                        practiceType: row['PRACTICE TYPE'],
                        practiceTypeDescription: row['PRACTICE TYPE DESCRIPTION'],
                        practiceNumber: row['PRACTICE  NUMBER'], 
                        contactNumber: row['CONTACT NUMBER']
                    });
                }
            })
            .on('end', async () => {
                try {
                    console.log(`📦 Parsed ${clinics.length} clinics. Pushing to test/clinics...`);
                    
                    // Bulk insert into the 'test' database
                    await Clinic.insertMany(clinics);
                    
                    console.log('✅ Successfully seeded all clinics to the test database!');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Error inserting data into test DB:', error);
                    process.exit(1);
                }
            });
    } catch (error) {
        console.error('❌ Database connection error:', error);
        process.exit(1);
    }
};

seedTestDatabase();