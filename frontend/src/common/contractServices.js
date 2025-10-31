import { ethers } from "ethers";
import { agriYieldAbi } from "../assets/agriYieldAbi.js";
import { marketPlaceAbi } from "../assets/marketPlaceAbi.js";
import { farmSharesAbi } from "../assets/farmSharesAbi.js";
import MockUSDTABI from "../assets/mockUsdtAbi.js";
import ERC20_ABI from "../assets/erc20Abi.js";

const AgriYieldABI = agriYieldAbi;
const MarketplaceABI = marketPlaceAbi;
const FarmSharesABI = farmSharesAbi;

const AGRIYIELD_ADDR = import.meta.env.VITE_AGRIYIELD_ADDRESS;
const MARKETPLACE_ADDR = import.meta.env.VITE_MARKETPLACE_ADDRESS;
const FARMSHARES_ADDR = import.meta.env.VITE_FARM_SHARES_ADDRESS;
const MOCK_USDT_ADDR = import.meta.env.VITE_MOCK_USDT_ADDRESS;

function getContract(address, abi, signer) {
  return new ethers.Contract(address, abi, signer);
}


/* ------------------ AGRIYIELD FUNCTIONS ------------------ */

// Create a new farm
export async function createFarm(signer,fundingGoal,shareSupply, sharePrice, metaCID) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, signer);
  const tx = await contract.createFarm(shareSupply, fundingGoal, sharePrice, metaCID);
  return tx.wait();
}

// Invest in a farm
export async function investInFarm(signer, farmId, amount) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, signer);
  const tx = await contract.invest(farmId, amount);
  return tx.wait();
}

// Disburse funds to farm owner
export async function disburseFunds(signer, farmId) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, signer);
  const tx = await contract.disburseFunds(farmId);
  return tx.wait();
}

// Deposit proceeds from produce sale
export async function depositProceeds(signer, farmId, amount) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, signer);
  const tx = await contract.depositProceeds(farmId, amount);
  return tx.wait();
}

// Claim Investor Payout
export async function claimInvestorPayout(signer, farmId) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, signer);
  const tx = await contract.claimInvestorPayout(farmId);
  return tx.wait();
}

// Get Farm
export async function getFarm(provider, farmId) {
  const contract = getContract(AGRIYIELD_ADDR, AgriYieldABI, provider);
  return contract.farms(farmId);
}

/* ------------------ MARKETPLACE FUNCTIONS ------------------ */

// List item for sale
export async function listItem(signer, farmId, price, quantity, metadataCID) {
  const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer);
  const tx = await contract.listItem(farmId, price, quantity, metadataCID);
  return tx.wait();
}

// Update Listing 
export async function updateListing(signer, listingId, price, quantity) {
  const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer);
  const tx = await contract.updateListing(listingId, price, quantity);
  return tx.wait();
}

// deactivate listing 
export async function deactivateListing(signer, listingId) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer);
    const tx = await contract.deactivateListing(listingId);
    return tx.wait();
}

// Purchase produce
export async function purchase(signer, listingId, quantity) {
  const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer);
  const tx = await contract.purchase(listingId, quantity);
  return tx.wait();
}

// Ship order 
export async function shipOrder(signer, orderId, shippingCID) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer)
    const tx = await contract.shipOrder(orderId, shippingCID)
    return tx.wait();
}

// Confirm received

export async function confirmReceived(signer, orderId, proofCID) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer)
    const tx = await contract.confirmReceived(orderId, proofCID)
    return tx.wait();
    
}
// Release Funds
export async function releaseFunds(signer, orderId) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer)
    const tx = await contract.releaseFunds(orderId);
    return tx.wait();
}
// Open Dispute
export async function openDispute(signer, orderId, reasaonCID) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer)
    const tx = await contract.openDispute(signer, orderId, reasaonCID)
    return tx.wait();
}
//  Resolve Dispute
export async function resolveDispute(signer, orderId, sellerFavor) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, signer)
    const tx = await contract.resolveDispute(signer, orderId, sellerFavor)
    return tx.wait();
}

// Get listings
export async function getListing(provider, listingId) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, provider)
    const tx = await contract.getListing(listingId)
}

// Get Orders
export async function getOrder(provider, orderId) {
    const contract = getContract(MARKETPLACE_ADDR, MarketplaceABI, provider)
    const tx = await contract.getOrder(orderId)
    return tx.wait();
}

/* ------------------ MARKETPLACE FUNCTIONS ------------------ */
// Track total shares, sold shares, and user’s owned shares
export async function getTotalShares(provider, farmId) {
  const contract = getContract(FARMSHARES_ADDR, FarmSharesABI, provider);
  return contract.totalShares(farmId);
}

export async function getSharesSold(provider, farmId) {
  const contract = getContract(FARMSHARES_ADDR, FarmSharesABI, provider);
  return contract.sharesSold(farmId);
}

export async function getRemainingShares(provider, farmId) {
  const [total, sold] = await Promise.all([
    getTotalShares(provider, farmId),
    getSharesSold(provider, farmId),
  ]);
  return total.sub(sold);
}

export async function getUserShares(provider, userAddress, farmId) {
  const contract = getContract(FARMSHARES_ADDR, FarmSharesABI, provider);
  return contract.balanceOf(userAddress, farmId);
}

/* ------------------ FAUCET & TOKEN FUNCTIONS ------------------ */

// Claim tokens from the faucet
export async function claimFaucet(signer, recipientAddress) {
  const contract = getContract(MOCK_USDT_ADDR, MockUSDTABI, signer);
  const tx = await contract.faucet(recipientAddress);
  return tx.wait();
}

// Get user's hUSDT balance
export async function getTokenBalance(provider, tokenAddress, userAddress) {
  const contract = getContract(tokenAddress, ERC20_ABI, provider);
  const balance = await contract.balanceOf(userAddress);
  return balance;
}

// Get last claim timestamp for a user
export async function getLastClaim(provider, userAddress) {
  const contract = getContract(MOCK_USDT_ADDR, MockUSDTABI, provider);
  const timestamp = await contract.lastClaim(userAddress);
  return timestamp;
}

// Get faucet amount
export async function getFaucetAmount(provider) {
  const contract = getContract(MOCK_USDT_ADDR, MockUSDTABI, provider);
  const amount = await contract.faucetAmount();
  return amount;
}

// Get faucet cooldown period
export async function getFaucetCooldown(provider) {
  const contract = getContract(MOCK_USDT_ADDR, MockUSDTABI, provider);
  const cooldown = await contract.faucetCooldown();
  return cooldown;
}

// Get token info (name, symbol, decimals)
export async function getTokenInfo(provider, tokenAddress) {
  const contract = getContract(tokenAddress, ERC20_ABI, provider);
  const [name, symbol, decimals] = await Promise.all([
    contract.name(),
    contract.symbol(),
    contract.decimals(),
  ]);
  return { name, symbol, decimals };
}

// Approve token spending
export async function approveToken(signer, tokenAddress, spenderAddress, amount) {
  const contract = getContract(tokenAddress, ERC20_ABI, signer);
  const tx = await contract.approve(spenderAddress, amount);
  return tx.wait();
}

// Check token allowance
export async function getTokenAllowance(provider, tokenAddress, ownerAddress, spenderAddress) {
  const contract = getContract(tokenAddress, ERC20_ABI, provider);
  const allowance = await contract.allowance(ownerAddress, spenderAddress);
  return allowance;
}
