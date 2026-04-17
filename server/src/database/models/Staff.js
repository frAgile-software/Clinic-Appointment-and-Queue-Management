import mongoose from 'mongoose';
const { Schema } = mongoose;

// Used to link admin and staff to a clinic
const staffSchema = new Schema({
    User: { type: Schema.Types.ObjectId, required: true},
    Clinic: { type: Schema.Types.ObjectId, required: true }
});

export default mongoose.model('Staff', staffSchema);