import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant extends Document {
  name: string;
  phoneNumber: string;
  email: string;
  qrCode: string | null;
  verified: boolean;
  createdAt: Date;
}

const participantSchema = new Schema<IParticipant>({
  name: {
    type: String,
    required: [true, 'Please provide participant name'],
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide phone number'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    trim: true,
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  qrCode: {
    type: String,
    required: false,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IParticipant>('Participant', participantSchema);
