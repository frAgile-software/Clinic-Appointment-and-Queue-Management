import mongoose from 'mongoose';
const { Schema } = mongoose;

const StaffSpeciality = new Schema({
  Staff:{ type: Schema.Types.ObjectId, ref: 'Staff' }, //FK
  Speciality:{ type: Schema.Types.ObjectId, ref: 'Speciality' } //Fk
});

export default StaffSpeciality;