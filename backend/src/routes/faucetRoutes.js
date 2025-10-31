import express from "express";
import { faucetController } from "../controllers/faucetController.js";

const router = express.Router();

router.post("/claim", async (req, res, next) => {
  try {
    await faucetController.claim(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
