import mongoose, { Document, Schema } from 'mongoose';

export interface IParticipant extends Document {
  name: string;
  phoneNumber: string;
  email: string;
  utrId: string | null;
  qrCode: string | null;
  attended: boolean;
  attendedAt: Date | null;
  verified: boolean;
  amount: number;
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
  utrId: {
    type: String,
    required: true,
    default: null,
  },
  qrCode: {
    type: String,
    required: false,
    default: null,
  },
  attended: {
    type: Boolean,
    default: false,
  },
  attendedAt: {
    type: Date,
    default: null,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  amount: {
    type: Number,
    required: false,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model<IParticipant>('Participant', participantSchema);
