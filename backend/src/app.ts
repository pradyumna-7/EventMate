import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import participantRoutes from './routes/participantRoutes';
import verificationRoutes from './routes/verificationRoutes';
import activityRoutes from './routes/activityRoutes';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
import fs from 'fs';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Routes
app.use('/api/participants', participantRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/activities', activityRoutes);

// For debugging - log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Server Error'
  });
});

export default app;
