import firebase from "../utils/firebase.js";

interface UploadOptions {
  folder?: string;
  allowedFileTypes?: string[];
  maxSizeInMB?: number;
  fileName?: string;
  fileType?: string;
}

type MimeType = "image/jpeg" | "image/png" | "image/webp" | "application/pdf";

const UploadFileToFirebase = async (
  fileData: string | Buffer,
  options: UploadOptions = {}
) => {
  try {
    const uniqueName = `${Date.now()}-${Math.floor(Math.random() * 10000000)}`;
    const buffer =
      typeof fileData === "string"
        ? Buffer.from(fileData.replace(/^data:.+;base64,/, ""), "base64")
        : fileData;

    const fileName =
      "options.fileName" +
        `${uniqueName}${getFileExtension(options.fileType as MimeType)}` ||
      `${uniqueName}${getFileExtension(options.fileType as MimeType)}`;
    const destination = options.folder
      ? `${options.folder}/${fileName}`
      : fileName;

    const file = firebase.file(destination);

    await file.save(buffer, {
      metadata: {
        contentType: options.fileType || "application/octet-stream",
        metadata: {
          firebaseStorageDownloadTokens: uniqueName, // for public access
        },
      },
      public: false,
      resumable: false,
    });

    const downloadURL = `https://firebasestorage.googleapis.com/v0/b/${
      firebase.name
    }/o/${encodeURIComponent(destination)}?alt=media&token=${uniqueName}`;

    return downloadURL;
  } catch (error: any) {
    console.error("Upload error:", error);
    throw new Error(`Upload failed: ${error.message}`);
  }
};

const getFileExtension = (mime: MimeType): string => {
  const map: Record<MimeType, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
  };
  return map[mime] || "";
};

export default UploadFileToFirebase;
