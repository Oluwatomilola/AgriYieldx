import * as faucetService from "../services/faucetService.js";

export const faucetController = {
  async claim(req, res) {
    try {
      const { accountId, amount } = req.body;
      const result = await faucetService.claim(accountId, amount);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  },
};
