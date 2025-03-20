import express from 'express';
import { getRecentActivities, getAllActivities, deleteAllActivities } from '../controllers/activityController';

const router = express.Router();

router.get('/recent', getRecentActivities);

router.get('/all', getAllActivities);

router.delete('/delete-all', deleteAllActivities);

export default router;
