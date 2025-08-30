import { Request, Response } from "express";
import User from "../models/User.js";
import DocumentUpload from "../models/DocumentUpload.js";
import QuestionsMessage from "../models/QuestionsMessage.js";

import { StatusCodes } from "http-status-codes";
import { BadRequestError, NotFoundError } from "../errors/index.js";

import axios from "axios";
import { GOOGLE_DRIVE_APIKEY } from "../utils/keys.js";
import { DeleteFileFromFirebase } from "../helpers/index.js";

const uploadDocumentByFile = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { fileUrl, fileType, fileName, fileSize, fileExtension } = req.body;

    if (!fileUrl || !fileType || !fileName || !fileSize || !fileExtension) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Please provide all values" });
    }

    const user = await User.findOne({ _id: req.user?.userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ sucess: false, msg: "User not found" });
    }

    // Ensure subscription status is up-to-date
    await user.updateSubscriptionStatus();

    // Define upload limits
    const uploadLimits: Record<"Free" | "Premium" | "Enterprise", number> = {
      Free: 10,
      Premium: 50,
      Enterprise: Infinity, // No limit for Enterprise users
    };

    // Ensure user.tier is valid, defaulting to "Free" if undefined
    const userTier = user.tier ?? "Free";

    const maxUploads = uploadLimits[userTier] ?? 10; // Default to Free plan

    // Ensure numberOfUpload is a number (default to 0 if undefined)
    const currentUploads = user.numberOfUpload ?? 0;

    // Check upload limit
    if (currentUploads >= maxUploads) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "Upload limit reached for your plan. Upgrade to upload more.",
      });
    }

    const newDocument = await DocumentUpload.create({
      userId: user._id,
      fileUrl,
      fileType,
      fileName,
      fileSize,
      fileExtension,
    });

    user.numberOfUpload = (user.numberOfUpload ?? 0) + 1;
    await user.save();

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "Document uploaded successfully",
      document: newDocument,
    });
  } catch (error: any) {
    console.error("Error fetching file details:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Function to extract the Google Drive file ID from a URL
const extractFileId = (url: string) => {
  const regex = /\/d\/(.+?)\//;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Function to get file details from Google Drive
const uploadDocumentByURL = async (
  req: Request,
  res: Response
): Promise<any> => {
  const { fileUrl } = req.body;

  if (!fileUrl) {
    throw new BadRequestError("Please provide all values");
  }

  try {
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

    const apiKey = GOOGLE_DRIVE_APIKEY;

    const apiUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=name,size,mimeType`;

    const response = await axios.get(apiUrl);
    const { name, size, mimeType } = response.data;

    // Determine the file extension based on the MIME type
    const extension = mimeType.split("/")[1];

    // console.log(`File Name: ${name}`);
    // console.log(`File Size: ${(size / 1024).toFixed(2)} KB`);
    // console.log(`File Extension: ${extension}`);

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
    console.error("Error fetching file details:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

const allDocuments = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ _id: req.user?.userId });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const documents = await DocumentUpload.find({ userId: user._id });

    if (documents.length < 0) {
      res.status(StatusCodes.OK).json({
        success: true,
        msg: "You have no documents",
        // documents
      });
    } else {
      res.status(StatusCodes.OK).json({
        success: true,
        msg: "Fetched successfully",
        documents,
      });
    }
  } catch (error: any) {
    console.error("Error fetching file details:", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

const deleteSingleDocument = async (
  req: Request,
  res: Response
): Promise<any> => {
  try {
    const { documentId } = req.params;

    const user = await User.findOne({ _id: req.user?.userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ sucess: false, msg: "User not found" });
    }

    const document = await DocumentUpload.findOneAndDelete({ _id: documentId });
    if (!document) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "Something went wrong while deleting the document",
      });
    }

    if (document.fileUrl) {
      await DeleteFileFromFirebase(document.fileUrl);
    }

    // Delete all messages related to the document
    await QuestionsMessage.deleteMany({ document: documentId });

    user.numberOfUpload = Math.max((user.numberOfUpload ?? 0) - 1, 0);
    await user.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: "Deleted successfully", document });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Error interacting text",
      error: error.message || error,
    });
  }
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
