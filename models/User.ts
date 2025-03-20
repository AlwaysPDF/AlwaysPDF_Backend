import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

interface UserDocument extends Document {
  fName?: string;
  lName?: string;
  email: string;
  password?: string;
  verificationToken?: string;
  verificationTokenExpirationDate?: Date;
  isVerified?: boolean;
  verified?: Date;
  passwordToken?: string | null;
  isPasswordTokenVerified?: boolean;
  passwordTokenExpirationDate?: Date | null;
  isProfileComplete?: boolean;
  numberOfEdits?: number;
  tier?: "Free" | "Premium" | "Enterprise";
  subscriptionStatus?: "Free" | "Active" | "Expired";
  subscriptionStartDate?: Date | null; 
  subscriptionEndDate?: Date | null;
  subscriptionPlan?: "Monthly" | "Yearly"; 
  lastLoggedIn?: Date;
  numberOfUpload?: number;

  comparePassword(candidatePassword: string): Promise<boolean>;
  updateSubscriptionStatus(): Promise<void>;
}


const UserSchema = new Schema<UserDocument>(
  {
    fName: {
      type: String,
      trim: true,
      default: "",
      // required: [true, "Please provide first name"],
    },
    lName: {
      type: String,
      trim: true,
      default: "",
      // required: [true, "Please provide last name"],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Please provide email address"],
      validate: {
        validator: (str: string) => validator.isEmail(str),
        message: "Please provide valid email",
      },
    },
    // profileImage: {
    //   type: String,
    //   trim: true,
    //   default: "",
    // },
    password: {
      type: String,
      default: "defaults",
      // required: [true, "Please provide password"],
      minlength: 8,
    },
    verificationToken: String,
    verificationTokenExpirationDate: {
      type: Date,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verified: Date,
    passwordToken: {
      type: String,
      default: null,
    },
    isPasswordTokenVerified: {
      type: Boolean,
      default: false,
    },
    passwordTokenExpirationDate: {
      type: Date,
      default: null,
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    numberOfEdits: {
      type: Number,
      default: 0,
    },
    tier: {
      type: String,
      enum: ["Free", "Premium", "Enterprise"],
      default: "Free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["Free", "Active", "Expired"],
      default: "Free",
    },
    subscriptionStartDate: {
      type: Date,
      default: null,
    },
    subscriptionEndDate: {
      type: Date,
      default: null,
    },
    subscriptionPlan: {
      type: String,
      enum: ["Monthly", "Yearly"],
      default: "Monthly",
    },
    lastLoggedIn: {
      type: Date,
    },
    numberOfUpload: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

UserSchema.pre<UserDocument>("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password!, salt);
});

UserSchema.methods.comparePassword = async function (
  canditatePassword: string
) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password!);
  return isMatch;
};

UserSchema.methods.updateSubscriptionStatus = async function () {
  if (this.subscriptionEndDate && new Date() > this.subscriptionEndDate) {
    this.subscriptionStatus = "Expired";
    this.tier = "Free"; // Downgrade to Free if expired
    this.subscriptionPlan = null
    await this.save();
  }
};


export default mongoose.model("User", UserSchema);
