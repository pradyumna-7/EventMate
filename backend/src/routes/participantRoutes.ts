import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { getAllParticipants } from '../controllers/participantController';

const router = express.Router();

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
    
    // Create new participant with null QR code
    const participant = new Participant({
      name,
      phoneNumber,
      email,
      qrCode: null
    });
    
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
router.get('/', getAllParticipants);

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
