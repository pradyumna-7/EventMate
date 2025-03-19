import mongoose, { Document, Schema } from 'mongoose';

export interface IActivity extends Document {
  action: string;
  user: string;
  timestamp: Date;
}

const activitySchema = new Schema<IActivity>({
  action: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
});

export default mongoose.model<IActivity>('Activity', activitySchema);
