import mongoose, { Schema, Document } from "mongoose";

// Extend Document for type safety
export interface PaymentDocument extends Document {
  userId: string;
  email: string;
  amount: number;
  currency: string;
  payment_status: string;
  session_id: string;
}

const PaymentSchema: Schema<PaymentDocument> = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    email: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    payment_status: { type: String, required: true },
    session_id: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<PaymentDocument>("Payment",PaymentSchema);
