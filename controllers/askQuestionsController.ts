// src/index.ts
import { Request, Response } from "express";
import multer from "multer";
// import bodyParser from 'body-parser';
import { parseOfficeAsync } from "officeparser";
import axios from "axios";
import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { StatusCodes } from "http-status-codes";
import DocumentUpload from "../models/DocumentUpload.js";
// import { BadRequestError } from "../errors/index.ts";

// const upload = multer({ dest: "uploads/" });

let pdfText: string | null = null;

// / New (i.e., OpenAI NodeJS SDK v4)
const openaiKey = process.env.OPENAI_APIKEY;

const openai = new OpenAI({
  // apiKey: process.env.OPENAI_APIKEY ? process.env.OPENAI_APIKEY : "",
  apiKey: openaiKey
});

// Function to download the PDF from the URL
const downloadPDF = async (url: string, outputPath: string): Promise<void> => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outputPath);
    response.data.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
};

const extractTextFromPDF = async (pdfPath: string): Promise<any> => {
  // return new Promise((resolve, reject) => {
  try {
    const data = await parseOfficeAsync(pdfPath);
    pdfText = data.toString();
    return data.toString();
  } catch (error) {
    return error;
  }
};

const Upload = async (req: Request, res: Response) => {
  // const { pdfUrl } = req.body;
  const { documentId } = req.params;

  // if (!pdfUrl) {
  //   return res
  //     .status(StatusCodes.NOT_FOUND)
  //     .json({ success: false, msg: "No PDF URL provided." });
  // }

  const document = await DocumentUpload.findOne({ _id: documentId });

  if (!document) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, msg: "No PDF URL provided." });
  }

  const pdfUrl = document.fileUrl;
  console.log(pdfUrl);

  if (!pdfUrl) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ success: false, msg: "No PDF URL provided." });
  }

  // if (pdfUrl !== document.fileUrl) {
  //   throw new BadRequestError("Error with the Url");

  // }

  // Ensure the uploads directory exists
  // const uploadsDir = path.join(__dirname, "uploads");
  const uploadsDir = path.resolve("/tmp");
  if (!fs.existsSync(uploadsDir)) {
    console.log(`Creating directory: ${uploadsDir}`);
    fs.mkdirSync(uploadsDir);
  } else {
    console.log(`Directory already exists: ${uploadsDir}`);
  }

  const outputPath = path.join(uploadsDir, "downloaded.pdf");

  try {
    // Download the PDF
    // console.log(`Downloading PDF from URL: ${pdfUrl} to path: ${outputPath}`);
    await downloadPDF(pdfUrl, outputPath);

    if (!fs.existsSync(outputPath)) {
      throw new Error(`File not found at path: ${outputPath}`);
    }

    pdfText = await extractTextFromPDF(outputPath);

    // Extract text from the downloaded PDF
    console.log(`Extracting text from downloaded PDF at path: ${outputPath}`);
    console.log(pdfText);

    // Clean up the downloaded file
    // console.log(`Deleting downloaded PDF from path: ${outputPath}`);
    fs.unlinkSync(outputPath);

    res.status(StatusCodes.OK).json({
      success: true,
      msg: "PDF downloaded and text extracted successfully.",
      pdfText,
    });
  } catch (error: any) {
    // console.error(`Error processing PDF: ${error.message}`);

    // Handle specific errors like "FormatError"
    if (error.message.includes("bad XRef entry")) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Invalid PDF format or corrupted file." });
    }

    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, msg: "Error processing PDF." });
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