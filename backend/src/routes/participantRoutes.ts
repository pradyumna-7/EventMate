import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { getAllParticipants, generateQRCodes } from '../controllers/participantController';

const router = express.Router();

router.get('/verified', (req: Request, res: Response) => {
  req.query.verified = 'true';
  console.log('Getting verified participants only');
  return getAllParticipants(req, res);
});

// Generate QR codes for participants
router.post('/generate-qr', generateQRCodes);


export default router;
