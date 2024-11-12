import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import { getMessages, addMessage } from "../controllers/Messages.js";

router.route("/getMessages/:documentId").get(authenticateUser, getMessages);
router.route("/addMessage").post(authenticateUser, addMessage);

export default router;
