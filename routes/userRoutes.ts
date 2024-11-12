import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import { updateUser, currentUser } from "../controllers/userController.js";

router.route("/updateUser").patch(updateUser);
router.route("/currentUser").get(authenticateUser, currentUser);

export default router;
