import express from 'express';
import { getRecentActivities } from '../controllers/activityController';

const router = express.Router();

router.get('/recent', getRecentActivities);

export default router;
