import { farmService } from "../services/farmService.js";

export const farmController = {
  async createCampaign(req, res) {
    try {
      const { farmer, fundingGoal, shareSupply, sharePrice } = req.body;
      const campaign = await farmService.createCampaign(farmer, fundingGoal, shareSupply, sharePrice);
      res.json(campaign);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },

  async invest(req, res) {
    try {
      const { campaignId, accountId, shares, farmerAccountId } = req.body;
      const result = await farmService.invest(campaignId, accountId, shares, farmerAccountId);
      res.json(result);
    } catch (err) {
      console.error(err);
      res.status(400).json({ error: err.message });
    }
  },

  async getStatus(req, res) {
    try {
      const { id } = req.params;
      const status = await farmService.getStatus(id);
      res.json(status);
    } catch (err) {
      console.error(err);
      res.status(404).json({ error: err.message });
    }
  },
};
