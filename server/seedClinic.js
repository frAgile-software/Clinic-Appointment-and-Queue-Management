const fs = require('fs');
const csv = require('csv-parser');
const dbConnect = require('./src/database/dbConnect');
const Clinic = require('./src/database/models/Clinic');

const filePath = process.argv[2];

if (!filePath) {
    console.error("❌ Please provide the path to the CSV file. Example: node seedClinics.js data.csv");
    process.exit(1);
}

const seedDatabase = async () => {
    // Connect to your MongoDB cluster
    await dbConnect();
    const clinics = [];

    // Stream and parse the CSV
    fs.createReadStream(filePath)
        .pipe(csv({ skipLines: 1 })) // Skips the completely empty row at the top of your CSV
        .on('data', (row) => {
            // Only push valid rows (ignoring trailing empty commas)
            if (row['PRACTICE NAME']) { 
                clinics.push({
                    province: row['PROVINCE'],
                    physicalTown: row['PHYSICAL TOWN'],
                    physicalSuburb: row['PHYSICAL SUBURB'],
                    physicalAddress: row['PHYSICAL ADDRESS'],
                    practiceName: row['PRACTICE NAME'],
                    practiceType: row['PRACTICE TYPE'],
                    practiceTypeDescription: row['PRACTICE TYPE DESCRIPTION'],
                    practiceNumber: row['PRACTICE  NUMBER'], // Correctly maps the double-space in the CSV header
                    contactNumber: row['CONTACT NUMBER']
                });
            }
        })
        .on('end', async () => {
            try {
                console.log(`📦 Parsed ${clinics.length} clinics from the CSV.`);
                console.log('⏳ Pushing to MongoDB Clinic collection...');
                
                // Bulk insert into the database
                await Clinic.insertMany(clinics);
                
                console.log('✅ Successfully seeded all clinics to the database!');
                process.exit(0);
            } catch (error) {
                console.error('❌ Error inserting data into MongoDB:', error);
                process.exit(1);
            }
        });
};

seedDatabase();