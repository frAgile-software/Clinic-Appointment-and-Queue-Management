const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    Patient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    Staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    Clinic: { type: Schema.Types.ObjectId, ref: 'Clinic', required: true },
    Speciality: { type: Schema.Types.ObjectId, ref: "Speciality", required: true },
    BookingDateTime: { type: Date, required: true }, 
    ReasonDetails: { type: String, trim: true } // e.g., "6 weeks pregnant", "sharp pain in lower back"
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;