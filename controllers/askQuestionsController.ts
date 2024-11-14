import { Request, Response } from "express";
import { parseOfficeAsync } from "officeparser";
import axios from "axios";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { StatusCodes } from "http-status-codes";
import DocumentUpload from "../models/DocumentUpload.js";
import { OPENAI_API_KEY } from "../utils/keys.js";
import crypto from "crypto";
// import { BadRequestError } from "../errors/index.ts";

// / New (i.e., OpenAI NodeJS SDK v4)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

let pdfText: string | "" = "";

const Upload = async (req: Request, res: Response) => {
  const { documentId } = req.params;

  try {
    // Validate document exists
    const document = await DocumentUpload.findOne({ _id: documentId });
    if (!document) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "No valid document or URL found." });
    }

    const pdfUrl = document?.fileUrl;
    const fileExtension = document?.fileExtension;
    console.log(pdfUrl);

    if (!pdfUrl || !fileExtension) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({
          success: false,
          msg: "No PDF URL or file extension provided.",
        });
    }

    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    const buffer = response.data;
    const extractedText = await parseOfficeAsync(buffer);
    pdfText = extractedText.toString();

    return res.status(StatusCodes.OK).json({
      success: true,
      msg: "PDF processed successfully",
      pdfText: extractedText.toString(),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error interacting text",
      error,
    });
  }
};

const askQuestion = async (
  req: Request,
  res: Response,
  question: string,
  pdfText: string
) => {
  // const { question } = req.body;

  if (!question || !pdfText) {
    return res.status(400).send("Question and PDF text are required.");
  }

  try {
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 10000,
      n: 1,
      stop: null,
      temperature: 0.7,

      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant. Provide concise and accurate answers.",
        },
        { role: "user", content: `PDF Content: ${pdfText}` },
        { role: "user", content: `Question: ${question}` },
      ],
      // question: `${question}`, // Question placed within body
    });

    // res.json({ answer: chatCompletion.choices[0].message.content });
    if (
      chatCompletion &&
      chatCompletion.choices &&
      chatCompletion.choices.length > 0 &&
      chatCompletion.choices[0] &&
      chatCompletion.choices[0].message &&
      chatCompletion.choices[0].message.content
    ) {
      return chatCompletion.choices[0].message.content;
      // res.json({ answer: chatCompletion.choices[0].message.content });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Unexpected response structure from OpenAI API.",
      });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error interacting with OpenAI API.",
      error,
    });
  }
};

export { Upload, askQuestion };
