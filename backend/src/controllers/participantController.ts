import { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { ParticipantData } from './verificationController';
import QRCode from 'qrcode';
import nodemailer from 'nodemailer';

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
          amount: participant.amount || 0, // Add amount field
          attended: false, // Initialize new field
          attendedAt: null // Initialize new field
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

// Get participant by ID
export const getParticipantById = async (req: Request, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    return res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching participant',
      error: error instanceof Error ? error.message : 'Unknown error'
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
        phoneNumber: participant.phoneNumber,
        attended: participant.attended,
        amount: participant.amount,
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

// Send QR codes to participants via email
export const sendQRCodes = async (req: Request, res: Response) => {
  try {
    // Find all verified participants with generated QR codes
    const participants = await Participant.find({ 
      verified: true,
      qrCode: { $ne: null }
    });

    if (participants.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No verified participants with QR codes found'
      });
    }

    // Configure nodemailer
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const results = [];

    // Send emails to each participant
    for (const participant of participants) {
      try {
        // Convert base64 QR code to buffer for attachment
        const qrCodeData = participant.qrCode!.split(';base64,').pop() || '';
        const qrBuffer = Buffer.from(qrCodeData, 'base64');

        // Send email with QR code
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || 'EventMate <noreply@eventmate.com>',
          to: participant.email,
          subject: 'Your Event QR Code',
          html: `
            <h1>Hello ${participant.name}!</h1>
            <p>Thank you for registering for our event. Please find your QR code attached to this email.</p>
            <p>Please present this QR code at the event entrance for quick check-in.</p>
            <p>We look forward to seeing you!</p>
            <p>Best regards,<br>The EventMate Team</p>
          `,
          attachments: [
            {
              filename: `qrcode-${participant.name}.png`,
              content: qrBuffer,
              contentType: 'image/png'
            }
          ]
        });

        results.push({
          id: participant._id,
          email: participant.email,
          success: true,
          message: 'QR code sent successfully'
        });
      } catch (error) {
        console.error(`Error sending email to ${participant.email}:`, error);
        results.push({
          id: participant._id,
          email: participant.email,
          success: false,
          message: error instanceof Error ? error.message : 'Failed to send email'
        });
      }
    }

    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return res.status(200).json({
      success: true,
      message: `QR codes sent to ${successCount} participants (${failureCount} failed)`,
      data: results
    });
  } catch (error) {
    console.error('Error sending QR codes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while sending QR codes',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
