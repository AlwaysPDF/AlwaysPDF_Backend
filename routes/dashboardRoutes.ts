// routes/dashboardRoutes.ts
import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import { getDashboardStats } from "../controllers/dashboardController";

router.route("/stats").get(authenticateUser, getDashboardStats);

export default router;
