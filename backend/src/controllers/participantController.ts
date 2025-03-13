import { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { ParticipantData } from './verificationController';

// Store participants from verification results to MongoDB
export const storeParticipants = async (participants: ParticipantData[]): Promise<IParticipant[]> => {
  try {
    const storedParticipants: IParticipant[] = [];
    
    for (const participant of participants) {
      // Check if participant with this email already exists
      const existingParticipant = await Participant.findOne({ email: participant.email });
      
      if (existingParticipant) {
        // Update existing participant
        existingParticipant.name = participant.name;
        existingParticipant.phoneNumber = participant.phone;
        existingParticipant.utrId = participant.utrId;
        existingParticipant.verified = participant.verified;
        existingParticipant.amount = participant.amount || 0; // Update amount field
        await existingParticipant.save();
        storedParticipants.push(existingParticipant);
      } else {
        // Create new participant with null QR code
        const newParticipant = await Participant.create({
          name: participant.name,
          phoneNumber: participant.phone,
          email: participant.email,
          utrId: participant.utrId,
          qrCode: null,
          verified: participant.verified,
          amount: participant.amount || 0 // Add amount field
        });
        storedParticipants.push(newParticipant);
      }
    }
    
    return storedParticipants;
  } catch (error) {
    console.error('Error storing participants:', error);
    throw error;
  }
};

// Get all participants with optional search and sorting
export const getAllParticipants = async (req: Request, res: Response) => {
  try {
    const { search, sortBy, sortOrder } = req.query;
    
    // Build the query
    let query = Participant.find();
    
    // Apply search if provided
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query = query.or([
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex }
      ]);
    }
    
    // Apply sorting if provided
    if (sortBy) {
      const sortDirection = sortOrder === 'desc' ? -1 : 1;
      const sortOptions: Record<string, number> = {};
      sortOptions[String(sortBy)] = sortDirection;
      query = query.sort(sortOptions as any);
    } else {
      // Default sort by createdAt in descending order
      query = query.sort({ createdAt: -1 });
    }
    
    const participants = await query.exec();
    
    return res.status(200).json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};
