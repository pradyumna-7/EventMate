import { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { ParticipantData } from './verificationController';
import QRCode from 'qrcode';

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
    const { search, sortBy, sortOrder, verified } = req.query;
    
    // Build the query
    let query = Participant.find();
    
    // Apply verified filter if provided
    if (verified !== undefined) {
      query = query.where('verified').equals(verified === 'true');
      console.log(`Filtering participants by verification status: ${verified}`);
    }
    
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
    console.log(`Found ${participants.length} participants matching criteria`);
    
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

// Generate QR codes for participants
export const generateQRCodes = async (req: Request, res: Response) => {
  try {
    const { participantIds } = req.body;
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of participant IDs'
      });
    }
    
    const results = [];
    
    for (const id of participantIds) {
      const participant = await Participant.findById(id);
      
      if (!participant) {
        results.push({ id, success: false, message: 'Participant not found' });
        continue;
      }
      
      // Skip generating if participant already has a QR code
      if (participant.qrCode) {
        results.push({ 
          id, 
          success: true, 
          message: 'QR code already exists',
          qrCode: participant.qrCode
        });
        continue;
      }
      
      // Generate QR code with participant data
      const qrData = JSON.stringify({
        id: participant._id,
        name: participant.name,
        email: participant.email,
        verified: participant.verified,
        timestamp: Date.now()
      });
      
      // Generate QR code as Base64 string
      const qrCode = await QRCode.toDataURL(qrData);
      
      // Update participant with QR code
      participant.qrCode = qrCode;
      await participant.save();
      
      results.push({
        id,
        success: true,
        message: 'QR code generated successfully',
        qrCode
      });
    }
    
    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error generating QR codes:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate QR codes'
    });
  }
};
