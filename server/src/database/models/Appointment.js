const mongoose = require("mongoose");
const { Schema } = mongoose;
const ConsultModel = require('./Consult');

const Appointment = ConsultModel.discriminator('Appointment',
    new Schema({
        Staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        ReasonDetails: { type: String, required: false, trim: true }, // e.g., "6 weeks pregnant", "sharp pain in lower back"
        BookingDateTime: { type: Date, required: true},
    }, {discriminatorKey: 'type'})
);

module.exports = Appointment;