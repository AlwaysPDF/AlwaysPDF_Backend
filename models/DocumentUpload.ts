import mongoose, { Schema, Document } from "mongoose";

interface DocumentUploadDocument extends Document {
  userId?: mongoose.Schema.Types.ObjectId;
  uploadDate?: string;
  fileUrl?: string;
  fileType?: string;
  fileName?: string;
  fileSize?: number;
  fileExtension?: string;
}

const DocumentUploadSchema = new Schema<DocumentUploadDocument>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    uploadDate: { type: Date, default: Date.now },
    fileUrl: { type: String, required: true },
    fileType: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    fileExtension: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("DocumentUpload", DocumentUploadSchema);
