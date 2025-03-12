import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import QRCode from 'qrcode';

const router = express.Router();

// Generate QR code from participant data
async function generateQRCode(participant: IParticipant): Promise<string> {
  try {
    const participantData = {
      id: participant._id,
      name: participant.name,
      email: participant.email
    };
    
    return await QRCode.toDataURL(JSON.stringify(participantData));
  } catch (error) {
    console.error('QR Code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
}

// Create a new participant
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, email } = req.body;
    
    if (!name || !phoneNumber || !email) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    
    // Check if participant already exists
    const existingParticipant = await Participant.findOne({ email });
    if (existingParticipant) {
      return res.status(409).json({ message: 'Participant with this email already exists' });
    }
    
    // Create new participant (without QR code first)
    const participant = new Participant({
      name,
      phoneNumber,
      email,
      qrCode: ''
    });
    
    // Generate QR code
    participant.qrCode = await generateQRCode(participant);
    
    // Save participant
    await participant.save();
    
    res.status(201).json({
      success: true,
      data: participant
    });
  } catch (error) {
    console.error('Error creating participant:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create participant'
    });
  }
});

// Get all participants
router.get('/', async (req: Request, res: Response) => {
  try {
    const participants = await Participant.find();
    res.status(200).json({
      success: true,
      count: participants.length,
      data: participants
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participants'
    });
  }
});

// Get a single participant
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const participant = await Participant.findById(req.params.id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participant'
    });
  }
});

// Update participant
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { name, phoneNumber, email } = req.body;
    const participant = await Participant.findByIdAndUpdate(
      req.params.id,
      { name, phoneNumber, email },
      { new: true, runValidators: true }
    );
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    
    // Update QR code if participant data changed
    participant.qrCode = await generateQRCode(participant);
    await participant.save();
    
    res.status(200).json({
      success: true,
      data: participant
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update participant'
    });
  }
});

// Delete participant
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const participant = await Participant.findByIdAndDelete(req.params.id);
    
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Participant successfully deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete participant'
    });
  }
});

export default router;
