// controllers/dashboardController.ts
import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import DocumentUpload from "../models/DocumentUpload.js";
import QuestionsMessage from "../models/QuestionsMessage.js";

const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    // Count uploads
    const totalUploads = await DocumentUpload.countDocuments({ user: userId });

    // Count questions
    const totalQuestions = await QuestionsMessage.countDocuments({
      user: userId,
      sender: "user",
      role: "user",
    });

    // Count active conversations
    // 7 days ago from now
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const activeConversations = await QuestionsMessage.countDocuments({
      user: userId,
      sender: "user",
      role: "user",
      createdAt: { $gte: sevenDaysAgo }, // only count conversations/messages within last 7 days
    });

    // Example: time saved → maybe you calculate per doc or per conversation
    const timeSaved = (totalUploads * 0.5).toFixed(1); // e.g., 0.5hrs per upload

    res.status(StatusCodes.OK).json({
      success: true,
      stats: {
        totalUploads,
        totalQuestions,
        activeConversations,
        timeSaved,
      },
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};

export { getDashboardStats };
