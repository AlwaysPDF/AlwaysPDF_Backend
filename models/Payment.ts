import mongoose, { Schema, Document, Types } from "mongoose";

// Extend Document for type safety
export interface PaymentDocument extends Document {
  userId: Types.ObjectId;
  email: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  sessionId: string;
  eventType: string;
}

const PaymentSchema: Schema<PaymentDocument> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentStatus: { type: String, required: true },
    sessionId: { type: String, required: true },
    eventType: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<PaymentDocument>("Payment", PaymentSchema);
