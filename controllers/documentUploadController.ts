import { Request, Response } from "express";
import User from "../models/User.js";
import DocumentUpload from "../models/DocumentUpload.js";

import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../errors/index.js";

import axios from "axios";
// import fs from "fs" ;
// import path from "path";

// import { TokenPayload } from "../type.js";

// Extend the Express Request interface to include user information
// interface CustomRequest extends Request {
//   user?: TokenPayload;
// }

const uploadDocumentByFile = async (req: Request, res: Response) => {
  const { fileUrl, fileType, fileName, fileSize, fileExtension } = req.body;

  if (!fileUrl || !fileType || !fileName || !fileSize || !fileExtension) {
    throw new BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ _id: req.user?.userId });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const newDocument = await DocumentUpload.create({
    userId: user._id,
    fileUrl,
    fileType,
    fileName,
    fileSize,
    fileExtension,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    msg: "Document uploaded successfully",
    document: newDocument,
  });
};


// Function to extract the Google Drive file ID from a URL
const extractFileId = (url: string) => {
  const regex = /\/d\/(.+?)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Function to get file details from Google Drive
const uploadDocumentByURL = async (req: Request, res: Response) => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    throw new BadRequestError("Please provide all values");
  }

  const fileId = extractFileId(fileUrl);
  if (!fileId) {
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: "Invalid Google Drive URL",
    });
    return;
  }

  const user = await User.findOne({ _id: req.user?.userId });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const apiKey = "AIzaSyDaVnoZOxgYJ6x2ifWCk5vUexMUFe-vgm8"; // Replace with your API key

  const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=name,size,mimeType`;

  try {
    const response = await axios.get(apiUrl);
    const { name, size, mimeType } = response.data;
    // console.log(response.data);

    // Determine the file extension based on the MIME type
    const extension = mimeType.split("/")[1];

    console.log(`File Name: ${name}`);
    console.log(`File Size: ${(size / 1024).toFixed(2)} KB`);
    console.log(`File Extension: ${extension}`);

    // Determine the file extension from MIME type
    let fileExtension = "";
    switch (mimeType) {
      case "application/pdf":
        fileExtension = "pdf";
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        fileExtension = "docx";
        break;
      case "image/jpeg":
        fileExtension = "jpg";
        break;
      case "image/png":
        fileExtension = "png";
        break;
      case "application/vnd.google-apps.document":
        fileExtension = "docx";
        break;
      case "application/vnd.google-apps.spreadsheet":
        fileExtension = "xls";
        break;
      case "application/vnd.google-apps.presentation":
        fileExtension = "ppt";
        break;
      default:
        fileExtension = "unknown";
    }

    const newDocument = await DocumentUpload.create({
      userId: user._id,
      fileUrl,
      fileType: extension,
      fileName: name,
      fileSize: size,
      fileExtension,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "Document uploaded successfully",
      document: newDocument,
    });
  } catch (error: any) {
    console.error(
      "Error fetching file details:",
      error.response?.data || error.message
    );

    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg:
        error.response?.data ||
        error.message ||
        "Something went wrong, please try again",
    });
  }
};

const allDocuments = async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user?.userId });
  if (!user) {
    throw new NotFoundError("User not found");
  }

  const documents = await DocumentUpload.find({ userId: user._id });

  if (documents.length < 0) {
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "you have no documents",
      // documents
    });
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "Fetched successfully",
      documents,
    });
  }
};

const deleteSingleDocument = async (req: Request, res: Response) => {
  const { documentId } = req.params;

  const document = await DocumentUpload.findOneAndDelete({ _id: documentId });

  res
    .status(StatusCodes.OK)
    .json({ success: true, msg: "Deleted successfully", document });

  // if (!document) {
  //   return res
  //     .status(StatusCodes.NOT_FOUND)
  //     .json({ success: false, msg: "Document not found" });
  // }
};

// AIzaSyDaVnoZOxgYJ6x2ifWCk5vUexMUFe-vgm8

// const uploadDocumentByURL = async (url: string) => {
//   try {
//     // Create a unique file name for the temporary download
//     // const fileId = uuidv4();
//     const tempFilePath = path.join(__dirname, `john.tmp`);

//     // Download the file
//     const response = await axios({
//       url,
//       method: "GET",
//       responseType: "stream",
//     });

//     // Write the file to the temp directory
//     const writer = fs.createWriteStream(tempFilePath);
//     response.data.pipe(writer);

//     // Wait for the file to finish writing
//     await new Promise((resolve, reject) => {
//       writer.on("finish", resolve);
//       writer.on("error", reject);
//     });

//     // Extract file information
//     const stats = fs.statSync(tempFilePath);
//     console.log(stats);

//     const size = `${(stats.size / 1024).toFixed(2)} KB`;
//     console.log(stats.size);

//     const name = path.basename(url).split("?")[0]; // Extract file name from URL
//     const extension = path.extname(name || "").slice(1);

//     console.log({ name, size, extension });

//     // Unlink (delete) the temp file after extracting information
//     fs.unlinkSync(tempFilePath);
//   } catch (error) {
//     console.error("Error downloading or processing file:", error);
//   }
// };


// getGoogleDriveFileDetails("https://docs.google.com/document/d/1hn_GhOoblmo4gShta01eb-3T2bqwC18qI2trQRym7dg/edit")

export {
  uploadDocumentByFile,
  allDocuments,
  deleteSingleDocument,
  uploadDocumentByURL,
};
