import { Request, Response } from "express";
import User from "../models/User.js";

import { StatusCodes } from "http-status-codes";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors/index.js";

import { createTokenUser } from "../utils/index.js";
import { TokenPayload } from "../type.js";
import {
  DeleteFileFromFirebase,
  UploadFileToFirebase,
} from "../helpers/index.js";

// Extend the Express Request interface to include user information
interface CustomRequest extends Request {
  user?: TokenPayload;
}

// update user with user.save()
const finishOnboarding = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, fName, lName, password } = req.body;
    if (!email || !fName || !lName || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "Please provide all values",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: "User doesn't exist",
      });
    }

    if (!user.isVerified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: "Please verify your email",
      });
    }

    // Ensure required fields are not undefined
    if (user.numberOfEdits === undefined) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: "Incomplete user data",
      });
    }

    if (user?.numberOfEdits > 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "User can't edit profile again",
      });
    }

    user.fName = fName;
    user.lName = lName;
    user.password = password;
    user.numberOfEdits = user.numberOfEdits + 1;
    user.isProfileComplete = true;
    await user.save();

    // Re-fetch the user to ensure the latest data is checked
    const updatedUser = await User.findOne({ email });
    if (
      !updatedUser ||
      !user._id ||
      !user.email ||
      !user.fName ||
      !user.lName ||
      !user.password ||
      !user.isProfileComplete ||
      !user.tier
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: "Incomplete user data",
      });
    }

    const tokenUser: TokenPayload = createTokenUser({
      userId: user?._id.toString(),
      email: user?.email,
      fName: user?.fName,
      lName: user?.lName,
      isProfileComplete: user?.isProfileComplete,
      tier: user?.tier,
    });

    // const token = createJWT({ payload: tokenUser })
    res.status(StatusCodes.OK).json({
      success: true,
      msg: "Profile updated successfully",
      user: tokenUser,
      // token,
    });
  } catch (error: any) {
    console.error("Error updating details:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg:
        error.response?.data ||
        error.message ||
        "Something went wrong, please try again",
    });
  }
};

const updateProfile = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fName, lName, bio, profilePicture } = req.body;

    if (!fName || !lName) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: "Please provide first name and last name",
      });
    }

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: "Unauthorized User",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: "User not found with this email",
      });
    }

    // Upload new profile picture if provided and different from existing
    if (profilePicture && profilePicture.startsWith("data:")) {
      // Delete existing image if it exists
      if (user.profilePicture) {
        await DeleteFileFromFirebase(user.profilePicture);
      }

      const uploadResult = await UploadFileToFirebase(profilePicture, {
        folder: "Users/ProfilePictures",
        allowedFileTypes: ["image/png", "image/jpg", "image/jpeg"],
        maxSizeInMB: 5,
      });

      user.profilePicture = uploadResult;
    }

    // Fields allowed to be updated
    if (fName !== undefined) user.fName = fName;
    if (lName !== undefined) user.lName = lName;
    if (bio !== undefined) user.bio = bio;

    user.isProfileComplete = !!(
      fName &&
      lName &&
      user.bio &&
      user.profilePicture
    );

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      msg: "User profile updated successfully",
      user: {
        userId: user._id,
        fName: user.fName,
        lName: user.lName,
        email: user.email,
        bio: user.bio,
        profilePicture: user.profilePicture,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (error) {
    console.error("Error updating tutor profile", error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

const currentUser = async (req: Request, res: Response): Promise<any> => {
  try {
    const user = await User.findOne({ _id: req.user?.userId });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ sucess: false, msg: "User not found" });
    }

    if (
      !user._id ||
      !user.email ||
      !user.fName ||
      !user.lName ||
      user.bio === undefined ||
      user.profilePicture === undefined ||
      user.isProfileComplete == undefined ||
      !user.tier
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ sucess: false, msg: "Incomplete user data" });
    }

    const tokenUser: TokenPayload = createTokenUser({
      userId: user?._id.toString(),
      email: user?.email,
      fName: user?.fName,
      lName: user?.lName,
      bio: user?.bio ?? "",
      profilePicture: user?.profilePicture ?? "",
      isProfileComplete: user?.isProfileComplete ?? false,
      tier: user?.tier,
    });

    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: "Fetched Succesfully", user: tokenUser });
  } catch (error: any) {
    console.error("Error fetchingdetails:", error);

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Internal Server Error",
    });
  }
};

// Change Password
const changePassword = async (req: Request, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, password, confirmPassword } = req.body;

    if (!currentPassword || !password || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "All fields are required." });
    }

    // Validate password criteria
    // const passwordError = PasswordValidation(password);
    // if (passwordError) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     success: false,
    //     msg: passwordError,
    //   });
    // }

    if (password !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "New passwords do not match." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, msg: "User not found." });
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, msg: "Old password is incorrect." });
    }

    user.password = password;
    await user.save();

    res
      .status(StatusCodes.OK)
      .json({ success: true, msg: "Password changed successfully." });
  } catch (error) {
    console.error("Error changing password:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ success: false, msg: "Internal Server Error" });
  }
};

// const addNumberOfEditsToExistingUsers = async () => {
//   try {
//     // Fetch all users without numberOfEdits
//     const usersWithoutNumberOfEdits = await User.find({
//       filledFriendTest: { $exists: false },
//     })

//     // Map through users and update numberOfEdits
//     const updatedUsers = await Promise.all(
//       usersWithoutNumberOfEdits.map(async (user) => {
//         // Perform your logic to calculate or set numberOfEdits
//         // For example, setting it to 0 initially
//         user.filledFriendTest = false

//         // Save the updated user
//         return await user.save()
//       })
//     )

//     console.log('Users updated with numberOfEdits:', updatedUsers)
//   } catch (error) {
//     console.error('Error updating numberOfEdits:', error)
//   }
// }

// // Call the function to add numberOfEdits to existing users
// addNumberOfEditsToExistingUsers()

export { finishOnboarding, updateProfile, currentUser, changePassword };
