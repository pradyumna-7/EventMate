import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { getAllParticipants, generateQRCodes, sendQRCodes, getParticipantById } from '../controllers/participantController';

const router = express.Router();

router.get('/verified', (req: Request, res: Response) => {
  req.query.verified = 'true';
  console.log('Getting verified participants only');
  return getAllParticipants(req, res);
});

// Get participant by ID
router.get('/:id', getParticipantById);

// Generate QR codes for participants
router.post('/generate-qr', generateQRCodes);

// Send QR codes to participants via email
router.post('/send-qr', sendQRCodes);

export default router;
