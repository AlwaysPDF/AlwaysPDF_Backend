import mongoose, { Schema, Document } from "mongoose";

// Define the structure of the document
interface QuestionsMessageDocument extends Document {
  message: string; // The user's question
  user: mongoose.Schema.Types.ObjectId; // The user asking the question
  sender: "user" | "ai"; // Identifies who sent the message (user or AI)
  role: "user" | "ai"; // Role of the sender
  document: mongoose.Schema.Types.ObjectId; // Reference to the uploaded PDF document
  modelType?: string; // The AI's response to the question
}

// Define the schema for the chat messages
const QuestionsMessageSchema = new Schema<QuestionsMessageDocument>(
  {
    message: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true,
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentUpload",
      required: true,
    },
    modelType: {
      type: String,
      required: true,
      default: "chatgpt",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt timestamps
  }
);

// Export the model
export default mongoose.model<QuestionsMessageDocument>(
  "QuestionsMessage",
  QuestionsMessageSchema
);
