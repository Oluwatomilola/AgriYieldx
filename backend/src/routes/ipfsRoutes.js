import express from "express";
import multer from "multer";
import { uploadToIpfs } from "../controllers/ipfsController.js";

const router = express.Router();
const upload = multer(); // memory storage

router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    await uploadToIpfs(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
