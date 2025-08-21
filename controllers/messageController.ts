import { Request, Response } from "express";
import QuestionsMessage from "../models/QuestionsMessage.js";
import {
  askChatGPTQuestion,
  askClaudeQuestion,
  askDeepseekQuestion,
} from "./askQuestionsController.js";

import { StatusCodes } from "http-status-codes";
import User from "../models/User.js";

// Get messages for a specific PDF
const getMessages = async (req: Request, res: Response): Promise<any> => {
  try {
    const { documentId } = req.params;
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
      modelType: msg?.modelType || "chatpgt",
      //   response: msg.sender === "ai" ? msg.response : null,
    }));

    // res.json(projectedMessages);
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "Fetched successfully",
      projectedMessages,
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Something went wrong, please try again",
    });
  }
};

// Add a new message (User asks a question, AI responds)
const addMessage = async (req: Request, res: Response): Promise<any> => {
  try {
    const { documentId, question, pdfText, modelType } = req.body;

    if (!documentId || !question || !pdfText || !modelType) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "Please provide all values",
      });
    }

    // if(user && user?._id){
    //     return res
    //   .status(StatusCodes.NOT_FOUND)
    //   .json({ success: false, msg: "No PDF URL provided." });
    // }

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
      modelType,
    });

    let aiResponse;
    try {
      if (modelType === "chatgpt") {
        aiResponse = await askChatGPTQuestion(question, pdfText);
      } else if (modelType === "claude") {
        aiResponse = await askClaudeQuestion(question, pdfText);
      } else {
        aiResponse = await askDeepseekQuestion(question, pdfText);
      }
    } catch (error: any) {
      console.error("AI API error:", error?.message || error);

      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Failed to get response from AI model",
        error: error?.message || "Unknown error",
      });
    }

    // Save the AI's response
    const aiMessage = await QuestionsMessage.create({
      message: aiResponse,
      user: user?._id,
      sender: "ai",
      role: "ai",
      document: documentId,
      modelType,
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
    console.log("Error ading messages: ", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Something went wrong, please try again",
    });
  }
};

export { getMessages, addMessage };
