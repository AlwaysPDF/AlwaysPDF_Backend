import {
  createJWT,
  createAdminJWT,
  isTokenValid,
  attachCookiesToResponse,
} from "./jwt.js";
import { OPENAI_API_KEY, GOOGLE_DRIVE_APIKEY } from "./keys.js";
import createTokenUser from "./createTokenUser.js";
// import createTokenAdmin from "./createTokenAdmin";
import checkPermissions from "./checkPermissions.js";
import sendVerificationEmail from "./sendVerificationEmail.js";
import sendResetPasswordEmail from "./sendResetPasswordEmail";
// import sendWelcomeEmail from "./sendWelcomeEmail";
// import sendOnboardingEmail from "./sendOnboardingEmail";
import createHash from "./createHash.js";

export {
  createJWT,
  createAdminJWT,
  isTokenValid,
  attachCookiesToResponse,
  OPENAI_API_KEY,
  GOOGLE_DRIVE_APIKEY,
  createTokenUser,
  // createTokenAdmin,
  checkPermissions,
  sendVerificationEmail,
  sendResetPasswordEmail,
  // sendWelcomeEmail,
  // sendOnboardingEmail,
  createHash,
};
