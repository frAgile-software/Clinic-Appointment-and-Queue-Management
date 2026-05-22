const mongoose = require('mongoose');
const { Schema } = mongoose;

const offDaysSchema = new Schema({
  staff_id: {
    type: Schema.Types.ObjectId,
    ref: "Staff",
    required: true
  },
  date: {
    type: Date,
    required: true
  },
});

const OffDays = mongoose.model("OffDays", offDaysSchema);
module.exports = OffDays;