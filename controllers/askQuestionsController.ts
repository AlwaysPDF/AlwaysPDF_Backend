import { Request, Response } from "express";
import { parseOfficeAsync, type OfficeParserConfig } from "officeparser";
import { StatusCodes } from "http-status-codes";

import axios from "axios";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import DocumentUpload from "../models/DocumentUpload.js";
import {
  OPENAI_API_KEY,
  DEEPSEEK_API_KEY,
  ANTHROPIC_API_KEY,
} from "../utils/keys.js";
// import { BadRequestError } from "../errors/index.ts";

// / New (i.e., OpenAI NodeJS SDK v4)
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: DEEPSEEK_API_KEY,
});
const claude = new Anthropic({
  apiKey: ANTHROPIC_API_KEY, // This is the default and can be omitted
});

// let pdfText: string | "" = "";

const Upload = async (req: Request, res: Response): Promise<any> => {
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

    if (!pdfUrl || !fileExtension) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: "No PDF URL or file extension provided.",
      });
    }

    const createOfficeParserConfig = (): OfficeParserConfig => {
      const config: OfficeParserConfig = {};
      if (process.env.NODE_ENV === "production") {
        config.tempFilesLocation = "/tmp";
      }
      return config;
    };

    const response = await axios.get(pdfUrl, { responseType: "arraybuffer" });
    const fileBuffer = Buffer.from(response.data);
    const extractedText = await parseOfficeAsync(
      fileBuffer,
      createOfficeParserConfig()
    );

    return res.status(StatusCodes.OK).json({
      success: true,
      msg: "PDF processed successfully",
      pdfText: extractedText.toString(),
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error interacting text",
      error: error.message || error,
    });
  }
};

const askChatGPTQuestion = async (
  req: Request,
  res: Response,
  question: string,
  pdfText: string
): Promise<any> => {
  try {
    if (!question || !pdfText) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Question and PDF text are required.");
    }

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
      return chatCompletion.choices?.[0].message.content;
      // res.json({ answer: chatCompletion.choices[0].message.content });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Unexpected response structure from OpenAI API.",
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || error || "Error interacting text",
    });
  }
};

const askClaudeQuestion = async (
  req: Request,
  res: Response,
  question: string,
  pdfText: string
): Promise<any> => {
  try {
    if (!question || !pdfText) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .send("Question and PDF text are required.");
    }
    const claudeCompletion = await claude.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Here is some PDF content: ${pdfText}\n\nPlease answer this question: ${question}`,
        },
      ],
    });

    if (
      claudeCompletion &&
      claudeCompletion.content &&
      claudeCompletion.content.length > 0
      // &&
      // claudeCompletion.content[0] &&
      // claudeCompletion.content[0]?.text
    ) {
      // Find the first text block in the content array
      const textBlock = claudeCompletion.content.find(
        (block) => block.type === "text"
      );

      if (textBlock && "text" in textBlock) {
        // console.log(claudeCompletion);
        // console.log(textBlock.text);
        return textBlock.text;
        // res.json({ answer: textBlock.text });
      }

      // console.log(claudeCompletion);
      // console.log(claudeCompletion.content?.[0]?.text);
      // return claudeCompletion?.content?.[0]?.text;
      // res.json({ answer: chatCompletion.choices[0].message.content });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Unexpected response structure from Claude API.",
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || error || "Error interacting text",
    });
  }
};

const askDeepseekQuestion = async (
  req: Request,
  res: Response,
  question: string,
  pdfText: string
): Promise<any> => {
  try {
  if (!question || !pdfText) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send("Question and PDF text are required.");
  }
    const chatCompletion = await deepseek.chat.completions.create({
      model: "deepseek-chat",
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
      return chatCompletion.choices?.[0].message.content;
      // res.json({ answer: chatCompletion.choices[0].message.content });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Unexpected response structure from OpenAI API.",
      });
    }
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || error || "Error interacting text",
    });
  }
};

export { Upload, askChatGPTQuestion, askClaudeQuestion, askDeepseekQuestion };
