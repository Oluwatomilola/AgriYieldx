import * as tokenService from "../services/tokenService.js";

export const tokenController = {
  async getBalance(req, res) {
    try {
      const { accountId } = req.params;
      const balance = await tokenService.getHusdtBalance(accountId);
      res.json({ accountId, balance });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async associate(req, res) {
    try {
      const { accountId } = req.body;
      const status = await tokenService.associateToken(accountId);
      res.json({ accountId, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async grantKyc(req, res) {
    try {
      const { accountId } = req.body;
      const status = await tokenService.grantKyc(accountId);
      res.json({ accountId, status });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
};
