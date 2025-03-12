import express, { Express } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import participantRoutes from './routes/participantRoutes';
import verificationRoutes from './routes/verificationRoutes';
import path from 'path';

// Load environment variables
dotenv.config();

// Create Express app
const app: Express = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventmate';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/participants', participantRoutes);
app.use('/api', verificationRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('EventMate API is running!');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
