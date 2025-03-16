import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { verifyPayments, getVerificationResults, updateVerificationStatus, deleteAllParticipants, undoVerification } from '../controllers/verificationController';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'phonepeFile' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed for PhonePe statements'));
    }
    if (file.fieldname === 'participantsFile' && !file.originalname.endsWith('.csv')) {
      return cb(new Error('Only CSV files are allowed for participant lists'));
    }
    cb(null, true);
  }
});

// Verify payments route
router.post(
  '/verify-payments',
  upload.fields([
    { name: 'phonepeFile', maxCount: 1 },
    { name: 'participantsFile', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      if (!files.phonepeFile || !files.participantsFile) {
        return res.status(400).json({ message: 'Both PhonePe statement and participants list are required' });
      }

      const expectedAmount = req.body.expectedAmount ? parseFloat(req.body.expectedAmount) : null;
      if (!expectedAmount || isNaN(expectedAmount)) {
        return res.status(400).json({ message: 'Valid expected payment amount is required' });
      }

      console.log(`Verifying payments with expected amount: ${expectedAmount}`);
      const phonepeFilePath = files.phonepeFile[0].path;
      const participantsFilePath = files.participantsFile[0].path;

      // Call the controller function to handle verification logic
      const result = await verifyPayments(phonepeFilePath, participantsFilePath, expectedAmount);

      // Cleanup temporary files
      fs.unlinkSync(phonepeFilePath);
      fs.unlinkSync(participantsFilePath);

      res.status(200).json(result);
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to verify payments'
      });
    }
  }
);

// Add the missing GET endpoint for verification results
router.get('/results', getVerificationResults);

router.put('/verify/:id', updateVerificationStatus);
router.put('/unverify/:id', undoVerification);
router.delete('/delete', deleteAllParticipants);

export default router;
