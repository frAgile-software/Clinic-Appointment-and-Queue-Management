import mongoose from 'mongoose';
const { Schema } = mongoose;

const specialitySchema = new Schema({
    SpecialityName: { type: Schema.Types.String, ref: 'SpecialityName', required: true}
});

export default mongoose.model('Speciality', specialitySchema);
