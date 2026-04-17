const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    auth0Id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    surname: { type: String, required: true, trim: true },
    title: { type: String, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    role: { type: String, required: true, enum: ["Patient", "Admin", "Staff"] }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;