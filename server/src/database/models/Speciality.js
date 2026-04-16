import mongoose from 'mongoose';
const { Schema } = mongoose;

const specialitySchema = new Schema({
    Speciality: {type: Schema.Types.ObjectId, ref: 'Speciality', required: true}, // PK
    SpecialityName: { type: Schema.Types.String, ref: 'SpecialityName', required: true}
});

export default mongoose.model('Speciality', specialitySchema);