const mongoose = require('mongoose');
const { Schema } = mongoose;

const patientLogSchema = new Schema({
    Speciality: {type: Schema.Types.ObjectId, ref: 'Speciality', required: true},
    Patient: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    Staff: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    VisitType: {type: String, required: true},
    TimeIn: {type: Date, required: true, default: Date.now},
    TimeOut: {type: Date, required: true, default: Date.now},
    TimeQStart: {type: Date, required: true, default: Date.now},
    Status: {type: String, required: true},
});

const PatientLog = mongoose.model('PatientLog', patientLogSchema);
module.exports = PatientLog;
