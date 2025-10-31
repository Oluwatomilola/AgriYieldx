import { Router } from "express";
import { createToken, associate, grantKyc, revokeKyc } from "../controllers/adminController.js";

const router = Router();

router.post("/createToken", async (req, res, next) => {
  try {
    await createToken(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/associate", async (req, res, next) => {
  try {
    await associate(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/grantKyc", async (req, res, next) => {
  try {
    await grantKyc(req, res);
  } catch (err) {
    next(err);
  }
});

router.post("/revokeKyc", async (req, res, next) => {
  try {
    await revokeKyc(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
