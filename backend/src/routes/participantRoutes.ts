import express, { Request, Response } from 'express';
import Participant, { IParticipant } from '../models/Participant';
import { getAllParticipants } from '../controllers/participantController';

const router = express.Router();


// Get all verified participants - MUST come before /:id route
router.get('/verified', (req: Request, res: Response) => {
  req.query.verified = 'true';
  console.log('Getting verified participants only');
  return getAllParticipants(req, res);
});

export default router;
