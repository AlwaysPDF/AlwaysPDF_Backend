import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  paymentHandler,
//   webhookHandler,
} from "../controllers/paymentController.js";

router.route("/create-checkout-session").post(authenticateUser, paymentHandler);
// router
//   .route("/webhook")
//   .post(express.raw({ type: "application/json" }), webhookHandler);

export default router;
