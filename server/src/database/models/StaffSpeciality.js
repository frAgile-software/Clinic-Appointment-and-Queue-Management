const mongoose = require('mongoose');
const { Schema } = mongoose;

const staffSpecialitySchema = new Schema({
  Staff:{ type: Schema.Types.ObjectId, ref: 'Staff' }, //FK
  Speciality:{ type: Schema.Types.ObjectId, ref: 'Speciality' } //Fk
});

const StaffSpeciality = mongoose.model('StaffSpeciality', staffSpecialitySchema);
module.exports = StaffSpeciality;