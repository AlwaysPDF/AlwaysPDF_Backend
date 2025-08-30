import { TokenUser, User } from "../type.js";

const createTokenUser = (user: User): TokenUser => {
  const {
    userId,
    email,
    fName,
    lName,
    bio,
    profilePicture,
    isProfileComplete,
    tier,
  } = user;
  return {
    userId,
    email,
    fName,
    lName,
    bio,
    profilePicture,
    isProfileComplete,
    tier,
  };
};

export default createTokenUser;
