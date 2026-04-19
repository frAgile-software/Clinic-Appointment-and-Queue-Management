const mongoose = require('mongoose');
const { Schema } = mongoose;

const specialitySchema = new Schema({
    SpecialityName: { type: Schema.Types.String, required: true}
});

const Speciality = mongoose.model('Speciality', specialitySchema);
module.exports = Speciality;
