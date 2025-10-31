import express from "express";
import { tokenController } from "../controllers/tokenController.js";

const router = express.Router();

router.get("/balance/:accountId", async (req, res, next) => {
  try {
    await tokenController.getBalance(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/associate", async (req, res, next) => {
  try {
    await tokenController.associate(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/grant-kyc", async (req, res, next) => {
  try {
    await tokenController.grantKyc(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
