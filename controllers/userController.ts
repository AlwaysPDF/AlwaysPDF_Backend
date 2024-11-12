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

// Extend the Express Request interface to include user information
interface CustomRequest extends Request {
  user?: TokenPayload;
}

// update user with user.save()
const updateUser = async (req: Request, res: Response) => {
  const { email, fName, lName, password } = req.body;
  if (!email || !fName || !lName || !password) {
    throw new BadRequestError("Please provide all values");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new NotFoundError("User doesn't exist");
  }

  if (!user.isVerified) {
    throw new UnAuthenticatedError("Please verify your email");
  }

  // Ensure required fields are not undefined
  if (user.numberOfEdits === undefined) {
    throw new UnAuthenticatedError("Incomplete user data");
  }

  if (user?.numberOfEdits > 0) {
    throw new BadRequestError("User can't edit profile again");
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
    throw new UnAuthenticatedError("Incomplete user data");
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
};

// const getSingleUser = async (req, res) => {
//   const user = await User.findOne({ _id: req.params.id }).select("-password");

//   if (!user) {
//     throw new NotFoundError("User doesn't exist");
//   }

//   res.status(StatusCodes.OK).json({
//     status: true,
//     msg: "Fetched successfully",
//     fName: user.fName,
//     lName: user.lName,
//     profileImage: user.profileImage,
//     gender: user.gender,
//     dateOfBirth: user.dateOfBirth,
//     school: user.school,
//   });
// };

const currentUser = async (req: Request, res: Response) => {
  // if (!req.user || !req.user.email) {
  //   throw new UnAuthenticatedError("User is not authenticated");
  // }

  const user = await User.findOne({ _id: req.user?.userId });

  if (!user) {
    throw new NotFoundError("User not found");
  }

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

  const tokenUser: TokenPayload = createTokenUser({
    userId: user?._id.toString(),
    email: user?.email,
    fName: user?.fName,
    lName: user?.lName,
    isProfileComplete: user?.isProfileComplete,
    tier: user?.tier,
  });

  res
    .status(StatusCodes.OK)
    .json({ success: true, msg: "Fetched Succesfully", user: tokenUser });
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

export { updateUser, currentUser };
