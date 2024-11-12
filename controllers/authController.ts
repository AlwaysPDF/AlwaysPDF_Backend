import { Request, Response } from "express";
import User from "../models/User.js";

import { StatusCodes } from "http-status-codes";
import { BadRequestError, UnAuthenticatedError } from "../errors/index.js";
import {
  createTokenUser,
  createJWT,
  sendVerificationEmail,
  createHash,
} from "../utils/index.js";

import crypto from "crypto";
import { TokenPayload } from "../type.js";
// import { noOfEmails } from "./emailStatisticsController.js";

// register
const register = async (req: Request, res: Response) => {
  const { email }: { email: string } = req.body;

  try {
    const emailAlreadyExists = await User.findOne({ email });
    if (emailAlreadyExists) {
      throw new BadRequestError("Email already exists");
    }

    const bytes = crypto.randomBytes(2);
    const number = bytes.readUInt16BE(0);
    const fourDigitNumber = number % 10000; // Ensure it's 4 digits

    const verificationToken: string = fourDigitNumber
      .toString()
      .padStart(4, "0");

    const sixtyMinutes = 1000 * 60 * 60;
    const verificationTokenExpirationDate = new Date(Date.now() + sixtyMinutes);

    const finalVerificationToken: string = createHash(verificationToken);

    const user = await User.create({
      email,
      verificationToken: finalVerificationToken,
      verificationTokenExpirationDate,
    });

    await sendVerificationEmail({
      email: user.email,
      verificationToken,
      // images: {
      //   otpImage:
      //     "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/otp.png?alt=media&token=a9ab02b0-0def-4250-85d5-0b74bd3d8b12",
      //   kampuslyLogo:
      //     "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/KampuslyOrange.png?alt=media&token=04f015d4-34ec-4a01-a6d0-4ddd2151518f",
      //   facebook:
      //     "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/facebook.png?alt=media&token=06e68199-a022-43d4-b006-72f8fba24da5",
      //   x: "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/x.png?alt=media&token=d8c24b89-251f-4beb-9879-36393e876151",
      //   instagram:
      //     "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/instagram.png?alt=media&token=a81c131a-a6b0-4a2f-865f-47fdc915e7fa",
      //   youtube:
      //     "https://firebasestorage.googleapis.com/v0/b/kampuslymain.appspot.com/o/youtube.png?alt=media&token=b1f9070d-8146-4449-8168-bad05e155c96",
      // },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: "Success! Please check your email to verify account",
      email: user.email,
    });
  } catch (error: unknown) {
    if (error instanceof BadRequestError) {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: error.message,
      });
    } else {
      console.error("Registration error:", error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: "Registration failed",
      });
    }
  }
};

// verifyEmail
const verifyEmail = async (req: Request, res: Response) => {
  const {
    verificationToken,
    email,
  }: { verificationToken: string; email: string } = req.body;

  if (!verificationToken || !email) {
    throw new BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new UnAuthenticatedError("Email doesn't exist");
  }

  const currentDate = new Date();

  if (
    user.verificationToken !== createHash(verificationToken) ||
    !user.verificationTokenExpirationDate || // Ensure expiration date is defined
    user.verificationTokenExpirationDate < currentDate
  ) {
    throw new UnAuthenticatedError("Verification Failed, Token Incorrect");
    // return
  }

  if (!user.isVerified) {
    user.isVerified = true;
    user.verificationToken = "";
    user.verified = new Date();
    await user.save();

    res.status(StatusCodes.OK).json({ success: true, msg: "Email Verified" });
  } else {
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "Email is already verified",
    });
  }
};

// login
const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnAuthenticatedError("Invalid Credentials");
  }

  if (!user.isVerified) {
    throw new UnAuthenticatedError("Please verify your email");
  }

  // Ensure required fields are not undefined
  if (
    !user._id ||
    !user.email ||
    !user.fName ||
    !user.lName ||
    !user.isProfileComplete ||
    !user.tier
  ) {
    throw new UnAuthenticatedError("Incomplete user data");
  }

  user.lastLoggedIn = new Date();
  await user.save();

  const tokenUser: TokenPayload = createTokenUser({
    userId: user?._id.toString(),
    email: user?.email,
    fName: user?.fName,
    lName: user?.lName,
    isProfileComplete: user?.isProfileComplete,
    tier: user?.tier,
  });

  const token = createJWT(tokenUser);

  res
    .status(StatusCodes.OK)
    .json({ success: true, msg: "Login Succesfully", user: tokenUser, token });
};

// logout
// const logout = async (req, res) => {
//   res.cookie("token", "logout", {
//     httpOnly: true,
//     expires: new Date(Date.now() + 1000),
//   });
//   res.status(StatusCodes.OK).json({ msg: "user logged out!" });
// };

// forgotPassword
// const forgotPassword = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new BadRequestError("Please provide valid email");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new UnAuthenticatedError("Email doesn't exist");
//   }

//   const bytes = crypto.randomBytes(2);
//   const number = bytes.readUInt16BE(0);
//   const fourDigitNumber = number % 10000; // Ensure it's 4 digits

//   const passwordToken = fourDigitNumber.toString().padStart(4, "0");

//   await sendResetPasswordEmail({
//     fName: user.fName,
//     email: user.email,
//     token: passwordToken,
//   });
//   await noOfEmails();

//   const tenMinutes = 1000 * 60 * 5;
//   const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

//   user.passwordToken = createHash(passwordToken);
//   user.passwordTokenExpirationDate = passwordTokenExpirationDate;
//   await user.save();

//   res.status(StatusCodes.OK).json({
//     success: true,
//     msg: "Please check your email for OTP",
//     email: user.email,
//   });
// };

// verifyEmailResetPassword
// const verifyEmailResetPassword = async (req, res) => {
//   const { token, email } = req.body;
//   if (!token || !email) {
//     throw new BadRequestError("Please provide all values");
//   }
//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new UnAuthenticatedError("Email doesn't exist");
//   }

//   const currentDate = new Date();

//   if (
//     user.passwordToken === createHash(token) &&
//     user.passwordTokenExpirationDate > currentDate
//   ) {
//     user.isPasswordTokenVerified = true;
//     user.passwordToken = null;
//     user.passwordTokenExpirationDate = null;
//     await user.save();

//     res
//       .status(StatusCodes.OK)
//       .json({ success: true, msg: "OTP verification successful" });
//   } else {
//     res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ success: false, msg: "OTP invalid" });
//   }
// };

// resetPassword
// const resetPassword = async (req, res) => {
//   const { email, newPassword, confirmPassword } = req.body;
//   if (!newPassword || !confirmPassword) {
//     throw new BadRequestError("Please provide all values");
//   }

//   if (newPassword !== confirmPassword) {
//     throw new BadRequestError("Password doesn't match");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new UnAuthenticatedError("Email doesn't exist");
//   }

//   if (!user.isPasswordTokenVerified) {
//     throw new UnAuthenticatedError("Please verify your email");
//   }

//   user.password = newPassword;
//   await user.save();

//   res
//     .status(StatusCodes.OK)
//     .json({ success: true, msg: "Password changed successful" });
// };

// const resendToken = async (req, res) => {
//   const { email } = req.body;

//   if (!email) {
//     throw new BadRequestError("Please provide valid email");
//   }

//   const user = await User.findOne({ email });

//   if (!user) {
//     throw new UnAuthenticatedError("Email doesn't exist");
//   }

//   const bytes = crypto.randomBytes(2);
//   const number = bytes.readUInt16BE(0);
//   const fourDigitNumber = number % 10000; // Ensure it's 4 digits

//   const verificationToken = fourDigitNumber.toString().padStart(4, "0");

//   const tenMinutes = 1000 * 60 * 5;
//   const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);

//   await sendVerificationEmail({
//     email,
//     fName: user.fName,
//     verificationToken,
//   });

//   user.verificationToken = createHash(verificationToken);
//   user.verificationTokenExpirationDate = passwordTokenExpirationDate;
//   await user.save();

//   res
//     .status(StatusCodes.OK)
//     .json({ success: true, msg: "OTP sent, please kindly check your email" });
// };

export {
  register,
  verifyEmail,
  login,
  //   logout,
  //   forgotPassword,
  //   verifyEmailResetPassword,
  //   resetPassword,
  //   resendToken,
};
