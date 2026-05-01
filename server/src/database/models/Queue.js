const mongoose = require('mongoose');
const { Schema } = mongoose;
                
const queueSchema = new Schema({

    Clinic: {type: Schema.Types.ObjectId, ref: 'Clinic', required: true}, //FK
    Speciality: {type: Schema.Types.ObjectId, ref: "Speciality", required: true}, //FK
    Patient: {type: Schema.Types.ObjectId, ref: 'User', required: true} //FK
}, { timestamps: true });

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;