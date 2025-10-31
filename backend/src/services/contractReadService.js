import { ethers } from "ethers";
import AgriYieldABI from "../abis/AgriYield.json" with { type: "json" };
import MarketplaceABI from "../abis/Marketplace.json" with { type: "json" };

const AGRIYIELD_ADDR = process.env.AGRIYIELD_ADDR;
const MARKETPLACE_ADDR = process.env.MARKETPLACE_ADDR;

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const agriYield = new ethers.Contract(AGRIYIELD_ADDR, AgriYieldABI, wallet);
const marketplace = new ethers.Contract(MARKETPLACE_ADDR, MarketplaceABI, wallet);

// ✅ Get campaign info
export async function getCampaign(farmId) {
  const campaign = await agriYield.getCampaign(farmId);
  return {
    id: campaign.id.toString(),
    farmer: campaign.farmer,
    fundingGoal: campaign.fundingGoal.toString(),
    shareSupply: campaign.shareSupply.toString(),
    sharePrice: campaign.sharePrice.toString(),
    sharesSold: campaign.sharesSold.toString(),
  };
}

// ✅ Shares left
export async function getSharesLeft(farmId) {
  const shares = await agriYield.getSharesLeft(farmId);
  return shares.toString();
}

// ✅ User shares
export async function getUserShares(account, farmId) {
  const shares = await agriYield.getUserShares(account, farmId);
  return shares.toString();
}

// ✅ Marketplace listings
export async function getProduce(produceId) {
  const produce = await marketplace.getProduce(produceId);
  return {
    id: produce.id.toString(),
    seller: produce.seller,
    price: produce.price.toString(),
    isSold: produce.isSold,
  };
}
