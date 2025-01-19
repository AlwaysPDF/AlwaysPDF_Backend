import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import { paymentHandler } from "../controllers/paymentController.js";

router.route("/create-checkout-session").post(authenticateUser, paymentHandler);

export default router;
