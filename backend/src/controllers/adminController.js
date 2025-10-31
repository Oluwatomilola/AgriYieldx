import * as tokenService from "../services/tokenService.js";

export async function createToken(req, res) {
  try {
    const { name, symbol, decimals } = req.body;

    // Validation
    if (name && (typeof name !== "string" || name.length > 100)) {
      return res.status(400).json({ error: "Name must be a string (max 100)" });
    }
    if (symbol && (typeof symbol !== "string" || symbol.length > 10)) {
      return res.status(400).json({ error: "Symbol must be a string (max 10)" });
    }
    if (decimals && (isNaN(Number(decimals)) || Number(decimals) < 0 || Number(decimals) > 18)) {
      return res.status(400).json({ error: "Decimals must be 0-18" });
    }

    const token = await tokenService.createFungibleToken({
      name: name ?? "Hedera USD Tether",
      symbol: symbol ?? "hUSDT",
      decimals: Number(decimals ?? 6),
    });

    res.json(token);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function associate(req, res) {
  try {
    const { accountId, tokenId } = req.body;
    const result = await tokenService.associateToken(accountId, tokenId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function grantKyc(req, res) {
  try {
    const { accountId, tokenId } = req.body;
    const result = await tokenService.grantKyc(accountId, tokenId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function revokeKyc(req, res) {
  try {
    const { accountId, tokenId } = req.body;
    const result = await tokenService.revokeKyc(accountId, tokenId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
