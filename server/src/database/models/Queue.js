const mongoose = require('mongoose');
const { Schema } = mongoose;
                
const queueSchema = new Schema({

    Clinic: {type: Schema.Types.ObjectId, ref: 'Clinic', required: true}, //FK
    Speciality: {type: Schema.Types.ObjectId, ref: "Speciality", required: true}, //FK
    BookingDateTime: {type: Date, required: true}, //This also aids FIFO logic
});

const Queue = mongoose.model('Queue', queueSchema);
module.exports = Queue;