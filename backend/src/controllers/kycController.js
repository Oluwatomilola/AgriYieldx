import * as tokenService from "../services/tokenService.js";

export async function checkKycStatus(req, res) {
  try {
    const { token, accountId } = req.params;
    const status = await tokenService.isKycEnabled(accountId, token);
    res.json({ accountId, token, kycGranted: status ?? false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
