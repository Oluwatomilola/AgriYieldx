import express from "express";
import {
  associateTokenWithContract,
  associateAllContracts,
  isContractAssociated,
  getContractTokenBalance
} from "../services/tokenAssociationService.js";

const router = express.Router();

/**
 * POST /api/association/contract
 * Associate a specific contract with HUSDT token
 * Body: { contractAddress: "0x..." }
 */
router.post("/contract", async (req, res) => {
  try {
    const { contractAddress } = req.body;
    
    if (!contractAddress) {
      return res.status(400).json({ error: "contractAddress is required" });
    }
    
    const result = await associateTokenWithContract(contractAddress);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error("Association error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/association/all
 * Associate all configured contracts with HUSDT token
 */
router.post("/all", async (req, res) => {
  try {
    const results = await associateAllContracts();
    res.json({
      success: true,
      message: "Token association completed for all contracts",
      results
    });
  } catch (error) {
    console.error("Association error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/association/check/:contractAddress
 * Check if a contract is associated with HUSDT token
 */
router.get("/check/:contractAddress", async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const isAssociated = await isContractAssociated(contractAddress);
    
    res.json({
      contractAddress,
      isAssociated,
      tokenId: process.env.HUSDT_TOKEN_ID
    });
  } catch (error) {
    console.error("Check association error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/association/balance/:contractAddress
 * Get HUSDT token balance of a contract
 */
router.get("/balance/:contractAddress", async (req, res) => {
  try {
    const { contractAddress } = req.params;
    const balance = await getContractTokenBalance(contractAddress);
    
    res.json({
      contractAddress,
      balance,
      tokenId: process.env.HUSDT_TOKEN_ID,
      balanceFormatted: (parseInt(balance) / 1000000).toFixed(2) + " HUSDT"
    });
  } catch (error) {
    console.error("Balance check error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

