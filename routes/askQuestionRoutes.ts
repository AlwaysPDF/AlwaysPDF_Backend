import express from "express";
const router = express.Router();

import { Upload, askQuestion } from "../controllers/askQuestionsController.js";

router.post("/upload/:documentId", Upload);
// router.post("/askQuestion", askQuestion);

export default router;
