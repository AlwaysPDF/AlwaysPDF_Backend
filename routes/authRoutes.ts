import express from "express";
const router = express.Router();

// production
// import rateLimiter from 'express-rate-limit/dist/index.cjs'
// const { rateLimiter } = pkg

// local
import rateLimiter from "express-rate-limit";

const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // store: ... , // Use an external store for more precise rate limiting
  message: "Too many requests from this IP, please try again after 15 minutes",
});

import { register, verifyEmail, login } from "../controllers/authController.js";

router.route("/register").post(register);
router.route("/verifyEmail").post(verifyEmail);
router.route("/login").post(apiLimiter, login);

export default router;
