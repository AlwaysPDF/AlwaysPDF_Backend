import { Request, Response } from "express";
import QuestionsMessage from "../models/QuestionsMessage.js";
import { askQuestion } from "./askQuestionsController.js";

import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";

// Get messages for a specific PDF
const getMessages = async (req: Request, res: Response): Promise<any> => {
  const { documentId } = req.params;

  try {
    const user = await User.findOne({ _id: req.user?.userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "User not found" });
    }

    const messages = await QuestionsMessage.find({
      user: user?._id,
      document: documentId,
    }).sort({ updatedAt: 1 });

    const projectedMessages = messages.map((msg) => ({
      fromSelf: msg.sender === "user",
      message: msg.message,
      //   response: msg.sender === "ai" ? msg.response : null,
    }));

    // res.json(projectedMessages);
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "Fetched successfully",
      projectedMessages,
    });
  } catch (error: any) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false,msg:
        error.response?.data ||
        error.message ||
        "Something went wrong, please try again" });
  }
};

// Add a new message (User asks a question, AI responds)
const addMessage = async (req: Request, res: Response): Promise<any> => {
  const { documentId, question, pdfText } = req.body;

  // if(user && user?._id){
  //     return res
  //   .status(StatusCodes.NOT_FOUND)
  //   .json({ success: false, msg: "No PDF URL provided." });
  // }

  try {
    const user = await User.findOne({ _id: req?.user?.userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "User not found" });
    }

    // Save the user's question
    const userMessage = await QuestionsMessage.create({
      message: question,
      user: user?._id,
      sender: "user",
      role: "user",
      document: documentId,
    });

    // Generate AI's response based on the user's question and the document
    const aiResponse = await askQuestion(req, res, question, pdfText);

    // Save the AI's response
    const aiMessage = await QuestionsMessage.create({
      message: aiResponse,
      user: user?._id,
      sender: "ai",
      role: "ai",
      document: documentId,
      // response: aiResponse
    });

    if (userMessage && aiMessage) {
      res.status(StatusCodes.OK).json({
        success: true,
        msg: "Message added and AI response generated successfully.",
        aiMessage,
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: false,
        msg: "Failed to add message or generate AI response.",
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg:
        error.response?.data ||
        error.message ||
        "Something went wrong, please try again",
    });
  }
};

export { getMessages, addMessage };
