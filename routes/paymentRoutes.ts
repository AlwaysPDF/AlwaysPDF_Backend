import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  paymentHandler,
  webhookHandler,
} from "../controllers/paymentController.js";

router.route("/create-checkout-session").post(authenticateUser, paymentHandler);
router.route("/webhook").post(webhookHandler);

export default router;
