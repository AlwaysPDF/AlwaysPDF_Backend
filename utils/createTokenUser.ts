import { TokenUser, User } from "../type.js";

const createTokenUser = (user: User): TokenUser => {
  const { userId, email, fName, lName, isProfileComplete, tier } = user;
  return {
    userId,
    email,
    fName,
    lName,
    isProfileComplete,
    tier,
  };
};

export default createTokenUser;
