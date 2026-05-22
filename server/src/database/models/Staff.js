const mongoose = require('mongoose');
const { Schema } = mongoose;

// Used to link admin and staff to a clinic
const staffSchema = new Schema({
    User: { type: Schema.Types.ObjectId, required: true, ref: "User", unique: false },
    Clinic: { type: Schema.Types.ObjectId, required: true, ref: "Clinic", unique: false }
});

staffSchema.index({ User: 1, Clinic: 1 }, { unique: true });

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;
