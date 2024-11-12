import mongoose, { Schema, Document } from "mongoose";

// Define the structure of the document
interface QuestionsMessageDocument extends Document {
  message: string; // The user's question
  user: mongoose.Schema.Types.ObjectId; // The user asking the question
  sender: "user" | "ai"; // Identifies who sent the message (user or AI)
  role: "user" | "ai"; // Role of the sender
  document: mongoose.Schema.Types.ObjectId; // Reference to the uploaded PDF document
  response: string; // The AI's response to the question
}

// Define the schema for the chat messages
const QuestionsMessageSchema = new Schema<QuestionsMessageDocument>(
  {
    message: {
      type: String,
      required: true, // The user's question is required
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // The user reference is required
    },
    sender: {
      type: String,
      enum: ["user", "ai"],
      required: true, // Identifies whether the message is from the user or AI
    },
    role: {
      type: String,
      enum: ["user", "ai"],
      required: true, // Specifies the role of the sender
    },
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DocumentUpload", // Reference to the uploaded PDF document
      required: true, // The document reference is required
    },
    response: {
      type: String,
      required: false, // The AI's response, only present if the sender is "ai"
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
