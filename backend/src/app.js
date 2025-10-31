// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { claimFaucet } from "./services/faucetService.js";
import { investInFarm, getFarmSharesLeft, getUserFarmShares } from "./services/farmService.js";
import { publishMessage } from "./services/hcsService.js";
import { grantKyc, revokeKyc } from "./services/tokenService.js";
import { getCampaign } from "./services/contractReadService.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Simple in-memory DB for faucet cooldowns
const faucetDB = { faucetClaims: {} };

/**
 * ✅ Faucet endpoint (claim hUSDT once every 24h)
 */
app.post("/api/faucet/claim", async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) return res.status(400).json({ error: "evmAddress required" });

    const amount = 1000 * 1000000; // 1,000 tokens with 6 decimals
    const result = await claimFaucet(evmAddress, amount, faucetDB);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Farm investment
 */
app.post("/api/farm/invest", async (req, res) => {
  try {
    const { accountId, farmId, amount, farmerAccountId } = req.body;
    if (!accountId || !farmId || !amount || !farmerAccountId) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const result = await investInFarm(accountId, farmId, amount, farmerAccountId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Check farm status
 */
app.get("/api/farm/:id/status", async (req, res) => {
  try {
    const farmId = req.params.id;
    const campaign = await getCampaign(farmId);
    const sharesLeft = await getFarmSharesLeft(farmId);

    res.json({
      ...campaign,
      sharesLeft,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get user shares in a farm
 */
app.get("/api/farm/:id/shares/:account", async (req, res) => {
  try {
    const { id: farmId, account } = req.params;
    const shares = await getUserFarmShares(account, farmId);
    res.json({ farmId, account, shares });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ HCS publish
 */
app.post("/api/hcs/publish", async (req, res) => {
  try {
    const { topicId, message } = req.body;
    if (!topicId || !message) return res.status(400).json({ error: "Missing topicId or message" });

    const status = await publishMessage(topicId, message);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Admin: grant KYC
 */
app.post("/api/admin/grantKyc", async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: "accountId required" });

    const status = await grantKyc(accountId);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Admin: revoke KYC
 */
app.post("/api/admin/revokeKyc", async (req, res) => {
  try {
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: "accountId required" });

    const status = await revokeKyc(accountId);
    res.json({ status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
