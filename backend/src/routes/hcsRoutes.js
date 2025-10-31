import express from "express";
import { hcsController } from "../controllers/hcsController.js";

const router = express.Router();

router.post("/create-topic", async (req, res, next) => {
  try {
    await hcsController.createTopic(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/publish", async (req, res, next) => {
  try {
    await hcsController.publishMessage(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
