import express from "express";
import { farmController } from "../controllers/farmController.js";

const router = express.Router();

router.post("/create", async (req, res, next) => {
  try {
    await farmController.createCampaign(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/invest", async (req, res, next) => {
  try {
    await farmController.invest(req, res);
  } catch (err) {
    next(err);
  }
});

router.get("/status/:id", async (req, res, next) => {
  try {
    await farmController.getStatus(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
