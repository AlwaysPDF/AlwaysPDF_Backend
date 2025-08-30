import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  finishOnboarding,
  updateProfile,
  currentUser,
  changePassword,
} from "../controllers/userController.js";

router.route("/finishOnboarding").patch(finishOnboarding);

router.route("/updateProfile").patch(authenticateUser, updateProfile);

router.route("/currentUser").get(authenticateUser, currentUser);

router.route("/changePassword").patch(authenticateUser, changePassword);

export default router;
