import { Request, Response } from 'express';
import Activity from '../models/Activity';

export const logActivity = async (action: string, user: string) => {
  try {
    await Activity.create({
      action,
      user,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .limit(10)
      .lean();
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities'
    });
  }
};

export const getAllActivities = async (req: Request, res: Response) => {
  try {
    const activities = await Activity.find()
      .sort({ timestamp: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching activities'
    });
  }
}

export const deleteAllActivities = async (req: Request, res: Response) => {
  try {
    await Activity.deleteMany();
    res.status(200).json({
      success: true,
      message: 'All activities deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting activities'
    });
  }
}
