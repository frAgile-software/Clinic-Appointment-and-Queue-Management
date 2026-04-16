import mongoose from 'mongoose';
const { Schema } = mongoose;
                
const QueueSchema = new Schema({
     Clinic: {type: Schema.Types.ObjectId, ref: 'Clinic', required: true}, //FK
    Speciality: {type: Schema.Types.ObjectId, ref: "Speciality", required: true}, //FK
    Patient: {type: Schema.Types.ObjectId, ref: 'Patient', required: true}, //FK
    Reason: {type: String, required: true},
    EntryTime: {type: Date, default: Date.now}, //First in first out logic based on time entered
    SequenceNumber: {type: Number, required: true}, //Auto-incremented number for queue order
    //I assume we remove records as they are processed.
    //If not, we would need a status field to indicate if the patient is waiting, in progress, or completed.
    //And then clear the queue at the end of everyday? 
});

export default mongoose.model('Queue', QueueSchema);