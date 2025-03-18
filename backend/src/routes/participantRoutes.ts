import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { 
  getAllParticipants, 
  generateQRCodes, 
  sendQRCodes, 
  getParticipantById,
  markAttendance,
  getAllAttendees,
  getUnattendedParticipants
} from '../controllers/participantController';

const router = express.Router();

router.get('/verified', (req: Request, res: Response) => {
  req.query.verified = 'true';
  console.log('Getting verified participants only');
  return getAllParticipants(req, res);
});

router.get('/get-all-attendees', getAllAttendees);

// Generate QR codes for participants
router.post('/generate-qr', generateQRCodes);

// Send QR codes to participants via email
router.post('/send-qr', sendQRCodes);

router.post('/mark-attendance', markAttendance);

router.get('/unattended', getUnattendedParticipants);

router.get('/:id', getParticipantById);

export default router;
