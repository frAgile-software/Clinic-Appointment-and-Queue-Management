const mongoose = require('mongoose');
const { Schema } = mongoose;

const notifSchema = new Schema({
    //will have a mongo given ID
    Recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true }, //FK
    Message: { type: String,  required: true }, 
    Time: {type: Date, required: true, default: Date.now},
    Seen: {type: Boolean, required: true, default: false},
}, { timestamps: true });

const Notif = mongoose.model('Notif', notifSchema);
module.exports = Notif;    