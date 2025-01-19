import {
  createJWT,
  createAdminJWT,
  isTokenValid,
  attachCookiesToResponse,
} from "./jwt.js";
import {
  OPENAI_API_KEY,
  GOOGLE_DRIVE_APIKEY,
  STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_TEST,
  STRIPE_WEBHOOK_SECRET_LIVE
} from "./keys.js";
import createTokenUser from "./createTokenUser.js";
// import createTokenAdmin from "./createTokenAdmin";
import checkPermissions from "./checkPermissions.js";
import sendVerificationEmail from "./sendVerificationEmail.js";
import sendResetPasswordEmail from "./sendResetPasswordEmail.js";
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
  STRIPE_SECRET_KEY_LIVE,
  STRIPE_WEBHOOK_SECRET_TEST,
  STRIPE_WEBHOOK_SECRET_LIVE,
  createTokenUser,
  // createTokenAdmin,
  checkPermissions,
  sendVerificationEmail,
  sendResetPasswordEmail,
  // sendWelcomeEmail,
  // sendOnboardingEmail,
  createHash,
};
