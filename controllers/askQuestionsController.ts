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
const generateTempFilename = () => {
  return `pdf-${crypto.randomBytes(8).toString("hex")}.pdf`;
};

// Ensure all necessary temporary directories exist
const ensureTempDirectories = () => {
  const tempDirs = ["/tmp/officeParserTemp", "/tmp/officeParserTemp/tempfiles"];

  tempDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
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

// Function to download the PDF from the URL
// const downloadPDF = async (url: string, outputPath: string): Promise<void> => {
//   const response = await axios({
//     url,
//     method: "GET",
//     responseType: "stream",
//   });
//   await new Promise((resolve, reject) => {
//     const stream = fs.createWriteStream(outputPath);
//     response.data.pipe(stream);
//     stream.on("finish", resolve);
//     stream.on("error", reject);
//   });
// };

// const extractTextFromPDF = async (pdfPath: string): Promise<any> => {
//   // return new Promise((resolve, reject) => {
//   try {
//     const data = await parseOfficeAsync(pdfPath);
//     pdfText = data.toString();
//     return data.toString();
//   } catch (error) {
//     return error;
//   }
// };

// Cleanup all temporary files in a directory
const cleanupTempDirectory = (dirPath: string) => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach((file) => {
        const curPath = path.join(dirPath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          cleanupTempDirectory(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
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
    ensureTempDirectories();

    // Validate document exists
    const document = await DocumentUpload.findOne({ _id: documentId });
    if (!document) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "No valid document or URL found." });
    }

    const pdfUrl = document.fileUrl;

    if (!pdfUrl) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "No PDF URL provided." });
    }

    // Generate unique filename for this upload
    const tempFileName = generateTempFilename();
    tempFilePath = path.join("/tmp", tempFileName);

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
     process.env.OFFICEPARSER_TEMP_PATH = '/tmp/officeParserTemp';

    const extractedText = await parseOfficeAsync(tempFilePath);
    pdfText = extractedText.toString();
    console.log(pdfText);

    // Clean up immediately after extraction
    cleanupTempFile(tempFilePath);
    cleanupTempDirectory('/tmp/officeParserTemp');

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
    cleanupTempDirectory('/tmp/officeParserTemp');

    // Safe error message checking
    const errorMessage = error?.message || "";

    // Handle specific error cases
    if (
      typeof errorMessage === "string" &&
      errorMessage.includes("bad XRef entry")
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Invalid PDF format or corrupted file." });
    }

    // Log error for debugging
    console.error("PDF processing error:", {
      error: error,
      message: errorMessage,
      stack: error?.stack,
    });

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error processing PDF.",
      error: error.message || "Unknown error occurred",
    });
  }
};

// const Upload = async (req: Request, res: Response) => {
//   // const { pdfUrl } = req.body;
//   const { documentId } = req.params;

//   // if (!pdfUrl) {
//   //   return res
//   //     .status(StatusCodes.NOT_FOUND)
//   //     .json({ success: false, msg: "No PDF URL provided." });
//   // }

//   const document = await DocumentUpload.findOne({ _id: documentId });

//   if (!document) {
//     return res
//       .status(StatusCodes.NOT_FOUND)
//       .json({ success: false, msg: "No PDF URL provided." });
//   }

//   const pdfUrl = document.fileUrl;
//   console.log(pdfUrl);

//   if (!pdfUrl) {
//     return res
//       .status(StatusCodes.NOT_FOUND)
//       .json({ success: false, msg: "No PDF URL provided." });
//   }

//   // if (pdfUrl !== document.fileUrl) {
//   //   throw new BadRequestError("Error with the Url");

//   // }

//   // Ensure the uploads directory exists
//   // const uploadsDir = path.join(__dirname, "uploads");
//   const uploadsDir = path.resolve("/tmp");
//   if (!fs.existsSync(uploadsDir)) {
//     console.log(`Creating directory: ${uploadsDir}`);
//     fs.mkdirSync(uploadsDir);
//   } else {
//     console.log(`Directory already exists: ${uploadsDir}`);
//   }

//   const outputPath = path.join(uploadsDir, "downloaded.pdf");

//   try {
//     // Download the PDF
//     // console.log(`Downloading PDF from URL: ${pdfUrl} to path: ${outputPath}`);
//     await downloadPDF(pdfUrl, outputPath);

//     if (!fs.existsSync(outputPath)) {
//       throw new Error(`File not found at path: ${outputPath}`);
//     }

//     pdfText = await extractTextFromPDF(outputPath);

//     // Extract text from the downloaded PDF
//     console.log(`Extracting text from downloaded PDF at path: ${outputPath}`);
//     console.log(pdfText);

//     // Clean up the downloaded file
//     // console.log(`Deleting downloaded PDF from path: ${outputPath}`);
//     fs.unlinkSync(outputPath);

//     res.status(StatusCodes.OK).json({
//       success: true,
//       msg: "PDF downloaded and text extracted successfully.",
//       pdfText,
//     });
//   } catch (error: any) {
//     // console.error(`Error processing PDF: ${error.message}`);

//     // Handle specific errors like "FormatError"
//     if (error.message.includes("bad XRef entry")) {
//       return res
//         .status(StatusCodes.BAD_REQUEST)
//         .json({ success: false, msg: "Invalid PDF format or corrupted file." });
//     }

//     res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ success: false, msg: "Error processing PDF." });
//   }
// };

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
      model: "gpt-4o",
      max_tokens: 10000,
      n: 1,
      stop: null,
      temperature: 0.7,

      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      messages: [
        // { role: "user", content: question }, // Add user message with PDF text
        // { role: "system", content: pdfText }, // Optionally add previous bot responses
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
