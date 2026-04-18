const mongoose = require("mongoose");
const { Schema } = mongoose;

const clinicSchema = new Schema({
  province: {
    type: String,
    required: true
  },
  physicalTown: {
    type: String,
    required: true
  },
  physicalSuburb: {
    type: String,
    required: true
  },
  physicalAddress: {
    type: String,
    required: true
  },
  practiceName: {
    type: String,
    required: true
  },
  practiceType: {
    type: String,
    required: true
  },
  practiceTypeDescription: {
    type: String,
    required: true
  },
  practiceNumber: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
    }
});

const Clinic = mongoose.model("Clinic", clinicSchema);
module.exports = Clinic;