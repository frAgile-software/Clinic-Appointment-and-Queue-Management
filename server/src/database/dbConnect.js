const mongoose = require('mongoose');

const dbConnect = async () => {
    mongoose.connect(process.env.MONGO_URL)
        .then((result) => {
            console.log('Connected to MongoDB');
        }).catch((err) => {
            console.error(err);
        });
}

module.exports = dbConnect;