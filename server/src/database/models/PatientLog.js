import mongoose from 'mongoose';
const { Schema } = mongoose;

const patientLogSchema = new Schema({
    Speciality: {type: Schema.Types.ObjectId, ref: 'Speciality', required: true},
    Patient: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    Staff: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    VisitType: {type: String, required: true},
    TimeIn: {type: Date, required: true, default: Date.now},
    TimeOut: {type: Date, required: true, default: Date.now},
    TimeQStart: {type: Date, required: true, default: Date.now}
});

export default mongoose.model('PatientLog', patientLogSchema);
