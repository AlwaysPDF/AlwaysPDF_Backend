import mongoose, { Schema, Document } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";

interface UserDocument extends Document {
  _id?: string;
  fName?: string;
  lName?: string;
  email: string;
  password?: string;
  verificationToken?: string;
  verificationTokenExpirationDate?: Date;
  isVerified?: boolean;
  verified?: Date;
  passwordToken?: string;
  isPasswordTokenVerified?: boolean;
  passwordTokenExpirationDate?: Date;
  isProfileComplete?: boolean;
  numberOfEdits?: number;
  tier?: string;
  lastLoggedIn?: Date;
  numberOfUpload?: Number;

  comparePassword(candidatePassword: string): Promise<boolean>;
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
    },
    isPasswordTokenVerified: {
      type: Boolean,
      default: false,
    },
    passwordTokenExpirationDate: {
      type: Date,
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
  // console.log(this.modifiedPaths());
  // console.log(this.isModified('name'));
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

export default mongoose.model("User", UserSchema);
