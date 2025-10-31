import { getHusdtBalance, transferHusdt, grantKyc } from "./tokenService.js";
import { ethers } from "ethers";
import AgriYieldABI from "../abis/AgriYield.json" with { type: "json" };

const AGRIYIELD_ADDR = process.env.AGRIYIELD_ADDR;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const agriYieldContract = new ethers.Contract(AGRIYIELD_ADDR, AgriYieldABI, wallet);

/**
 * ✅ Investor invests in a farm campaign
 */
export async function investInFarm(accountId, farmId, shares, farmerAccountId) {
  // 1. Grant KYC if not already
  const kycStatus = await grantKyc(accountId);

  // 2. Check balance + compute total cost
  const balance = await getHusdtBalance(accountId);
  const sharePrice = await agriYieldContract.getSharePrice(farmId);
  const totalCost = Number(sharePrice) * shares;

  if (balance < totalCost) {
    throw new Error("Insufficient hUSDT balance for investment");
  }

  // 3. Transfer hUSDT (investor → farmer treasury)
  const transferStatus = await transferHusdt(accountId, farmerAccountId, totalCost);
  if (transferStatus !== "SUCCESS") {
    throw new Error("hUSDT transfer failed");
  }

  // 4. Allocate FarmShares via AgriYield contract
  const tx = await agriYieldContract.invest(farmId, shares);
  const receipt = await tx.wait();

  return {
    kycStatus,
    transferStatus,
    farmShareTx: receipt.transactionHash,
    sharesBought: shares,
    totalCost
  };
}

/**
 * ✅ Get number of FarmShares left in a campaign
 */
export async function getFarmSharesLeft(farmId) {
  const sharesLeft = await agriYieldContract.getSharesLeft(farmId);
  return sharesLeft.toString();
}

/**
 * ✅ Get how many FarmShares a user has bought in a campaign
 */
export async function getUserFarmShares(account, farmId) {
  const shares = await agriYieldContract.getUserShares(account, farmId);
  return shares.toString();
}

/**
 * ✅ Get campaign details from AgriYield contract
 */
export async function getFarmCampaign(farmId) {
  const campaign = await agriYieldContract.getCampaign(farmId);
  return {
    id: campaign.id.toString(),
    farmer: campaign.farmer,
    fundingGoal: campaign.fundingGoal.toString(),
    shareSupply: campaign.shareSupply.toString(),
    sharePrice: campaign.sharePrice.toString(),
    sharesSold: campaign.sharesSold.toString(),
  };
}
