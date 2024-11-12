import express from "express";
const router = express.Router();

import { authenticateUser } from "../middleware/authentication.js";

import {
  uploadDocumentByFile,
  uploadDocumentByURL,
  allDocuments,
  deleteSingleDocument,
} from "../controllers/documentUploadController.js";

router
  .route("/uploadDocumentByFile")
  .post(authenticateUser, uploadDocumentByFile);

router
  .route("/uploadDocumentByURL")
  .post(authenticateUser, uploadDocumentByURL);

router.route("/allDocuments").get(authenticateUser, allDocuments);

router
  .route("/document/:documentId")
  .delete(authenticateUser, deleteSingleDocument);

export default router;
