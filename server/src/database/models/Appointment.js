import mongoose from 'mongoose';
const { Schema } = mongoose;

const appointmentSchema = new Schema({
    Patient: {type: Schema.Types.ObjectId, ref: 'User', required: true},            // FK
    Staff: {type: Schema.Types.ObjectId, ref: 'User', required: true},              // FK
    Clinic: {type: Schema.Types.ObjectId, ref: 'Clinic', required: true},           // FK
    BookingDateTime: {type: Date, required: true},
    Speciality: {type: Schema.Types.ObjectId, ref: "Speciality", required: true}    // FK - reason changed to speciality 
    // can add a comment field for patients to add more details?
});

export default mongoose.model('Appointment', appointmentSchema);
