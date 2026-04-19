const mongoose = require('mongoose');
const { Schema } = mongoose;

// Used to link admin and staff to a clinic
const staffSchema = new Schema({
    User: { type: Schema.Types.ObjectId, required: true},
    Clinic: { type: Schema.Types.ObjectId, required: true }
});

const Staff = mongoose.model('Staff', staffSchema);
module.exports = Staff;