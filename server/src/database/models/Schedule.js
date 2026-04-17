import mongoose from 'mongoose';
const { Schema } = mongoose;

const scheduleSchema = new Schema({
    Staff: { type: Schema.Types.ObjectId, required: true },
    DayOfWeek: { type: Number, min: 0, max: 6 },
    StartTime: { 
        type: String,    //dont want to store a whole date, so going to store in form "HH:mm"
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // match to HH:MM 24 hour time (0 or 1 + any digit OR 2 + 0-3) : (0 to 5 + any digit)
    },
    EndTime: {
        type: String,
        required: true,
        match: /^([01]\d|2[0-3]):([0-5]\d)$/ // match to HH:MM 24 hour time
    }
});

export default mongoose.model('Schedule', scheduleSchema);