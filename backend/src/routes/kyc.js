import { Router } from "express";
import { checkKycStatus } from "../controllers/kycController.js";

const router = Router();

router.get("/status/:token/:accountId", async (req, res, next) => {
  try {
    await checkKycStatus(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
