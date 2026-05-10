const mongoose = require('mongoose');
const { Schema } = mongoose;

const consultSchema = new Schema({
    Patient: { type: Schema.Types.ObjectId, ref: 'User', required: true }, //FK
    Clinic: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true }, //FK
    Speciality: { type: Schema.Types.ObjectId, ref: "Speciality", required: true }, //FK
    Staff: { type: Schema.Types.ObjectId, ref: 'User', required: false }, //FK
    Status: { type: String, required: true, enum: ["Waiting", "In Consult", "Completed", "Cancelled", "No-show"], default: "Waiting" },
    Remarks: { type: String, required: false, trim: true },
}, { timestamps: true, discriminatorKey: 'type' });

const Consult = mongoose.model('Consult', consultSchema);
module.exports = Consult;