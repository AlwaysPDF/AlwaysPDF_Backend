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

let pdfText: string | null = null;

// Generate a unique filename for each upload
const generateTempFilename = (fileExtension: string) => {
  return `pdf-${crypto.randomBytes(8).toString("hex")}.${fileExtension}`;
};

// Ensure all necessary temporary directories exist
const ensureTempDirectories = () => {
  const tempDirs = [
    '/tmp/officeParserTemp',
    '/tmp/officeParserTemp/tempfiles'
  ];

  for (const dir of tempDirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    } catch (error) {
      console.error(`Error creating directory: ${dir}`, error);
      throw error;
    }
  }
};

// Cleanup function to ensure temp file is deleted
const cleanupTempFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Cleaned up temporary file: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error cleaning up temporary file: ${filePath}`, error);
  }
};

// Cleanup all temporary files in a directory
const cleanupTempDirectory = (dirPath: string) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach(file => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          cleanupTempDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(dirPath);
    }
  } catch (error) {
    console.error(`Error cleaning up directory: ${dirPath}`, error);
  }
};

const Upload = async (req: Request, res: Response) => {
  const { documentId } = req.params;
  let tempFilePath: string | "" = "";

  try {
   // Ensure temporary directories exist
  //  await ensureTempDirectories();


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
        .json({ success: false, msg: "No PDF URL provided." });
    }

    // Generate unique filename for this upload
    const tempFileName = generateTempFilename(fileExtension);
    tempFilePath = path.join(process.cwd(), tempFileName);

    // Download PDF
    await axios({
      url: pdfUrl,
      method: "GET",
      responseType: "stream",
    }).then(
      (response) =>
        new Promise((resolve, reject) => {
          const writeStream = fs.createWriteStream(tempFilePath!);
          response.data.pipe(writeStream);
          writeStream.on("finish", resolve);
          writeStream.on("error", reject);
        })
    );

    // Verify file exists and extract text
    if (!fs.existsSync(tempFilePath)) {
      throw new Error("Downloaded file not found");
    }

     // Set environment variable for officeparser temp directory
    //  process.env.OFFICEPARSER_TEMP_PATH = '/tmp/officeParserTemp';

    const extractedText = await parseOfficeAsync(tempFilePath);
    pdfText = extractedText.toString();
    console.log(pdfText);

    // Clean up temporary files
    cleanupTempFile(tempFilePath);
    // await cleanupTempDirectory('/tmp/officeParserTemp');

    return res.status(StatusCodes.OK).json({
      success: true,
      msg: "PDF processed successfully",
      pdfText: extractedText.toString(),
    });
  } catch (error: any) {
    // Ensure cleanup happens even if there's an error
    if (tempFilePath) {
      cleanupTempFile(tempFilePath);
    }
    // await cleanupTempDirectory('/tmp/officeParserTemp');

    // Safe error message checking
    const errorMessage = error?.message || "";

    // Log error for debugging
    console.error("PDF processing error:", {
      error: error,
      message: errorMessage,
      stack: error?.stack,
    });

    // Handle specific error cases
    if (
      typeof errorMessage === "string" &&
      errorMessage.includes("bad XRef entry")
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Invalid PDF format or corrupted file." });
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error processing PDF.",
      error: error.message || "Unknown error occurred",
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
