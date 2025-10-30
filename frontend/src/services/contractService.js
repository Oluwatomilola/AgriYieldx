import { ethers, BrowserProvider, JsonRpcSigner } from "ethers";
import { getPublicClient, getConnectorClient } from "@wagmi/core";
import { config } from "../config.js";
import { agriYieldAbi } from "../assets/agriYieldAbi.js";
import { marketPlaceAbi } from "../assets/marketPlaceAbi.js";

const CONTRACT_ADDRESSES = {
  agriYield: import.meta.env.VITE_AGRIYIELD_ADDRESS,
  marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS,
  mockUsdt: import.meta.env.VITE_MOCK_USDT_ADDRESS
};

function publicClientToProvider(publicClient) {
  const { chain, transport } = publicClient
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  return new BrowserProvider(transport, network)
}

function clientToSigner(client) {
  const { account, chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  const provider = new BrowserProvider(transport, network)
  const signer = new JsonRpcSigner(provider, account.address)
  return signer
}

async function getProvider() {
  const publicClient = getPublicClient(config);
  if (!publicClient) return undefined;
  return publicClientToProvider(publicClient);
}

async function getSigner() {
  const client = await getConnectorClient(config);
  if (!client) return undefined;
  return clientToSigner(client);
}

// Accept either:
// - a provider or signer object (from wagmi/useSigner or ethers),
// - the boolean `true` (legacy shorthand meaning: obtain a signer), or
// - null/false/undefined (obtain a provider).
async function getAgriYieldContract(providerOrSigner = null) {
  let resolved;
  if (providerOrSigner === true) {
    resolved = await getSigner();
  } else if (!providerOrSigner) {
    resolved = await getProvider();
  } else {
    resolved = providerOrSigner;
  }

  return new ethers.Contract(CONTRACT_ADDRESSES.agriYield, agriYieldAbi, resolved);
}

async function getMarketplaceContract(providerOrSigner = null) {
  let resolved;
  if (providerOrSigner === true) {
    resolved = await getSigner();
  } else if (!providerOrSigner) {
    resolved = await getProvider();
  } else {
    resolved = providerOrSigner;
  }

  return new ethers.Contract(CONTRACT_ADDRESSES.marketplace, marketPlaceAbi, resolved);
}

export async function createFarm(goal, shares, price, cid, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);
  const tx = await contract.createFarm(goal, shares, price, cid);
  await tx.wait();
  return tx;
}

export async function invest(farmId, amount, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);
  const tx = await contract.invest(farmId, amount);
  await tx.wait();
  return tx;
}

export async function getFarm(farmId, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? null);
  return await contract.getFarm(farmId);
}

export async function getFarms(providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? null);
  const farmCount = await contract.farmCount();
  const farms = [];
  for (let i = 1; i <= farmCount; i++) {
    const farm = await contract.getFarm(i);
    farms.push({ id: i, ...farm });
  }
  return farms;
}

export async function disburseFunds(farmId, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);
  const tx = await contract.disburseFunds(farmId);
  await tx.wait();
  return tx;
}

export async function depositProceeds(farmId, amount, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);
  const tx = await contract.depositProceeds(farmId, amount);
  await tx.wait();
  return tx;
}

export async function claimInvestorPayout(farmId, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);
  const tx = await contract.claimInvestorPayout(farmId);
  await tx.wait();
  return tx;
}

export async function getInvestorShares(farmId, investorAddress, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? null);
  return await contract.investorShares(farmId, investorAddress);
}

export async function getListings(providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? null);
  const nextListingId = await contract.nextListingId();
  const listings = [];
  for (let i = 1; i < nextListingId; i++) {
    const listing = await contract.getListing(i);
    if (listing.isActive) {
      listings.push({ id: i, ...listing });
    }
  }
  return listings;
}

export async function purchase(listingId, qty, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.purchase(listingId, qty);
  await tx.wait();
  return tx;
}

export async function getOrder(orderId, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? null);
  return await contract.getOrder(orderId);
}

export async function shipOrder(orderId, shippingCID, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.shipOrder(orderId, shippingCID);
  await tx.wait();
  return tx;
}

export async function confirmReceived(orderId, proofCID, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.confirmReceived(orderId, proofCID);
  await tx.wait();
  return tx;
}

export async function releaseFunds(orderId, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.releaseFunds(orderId);
  await tx.wait();
  return tx;
}

export async function openDispute(orderId, reasonCID, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.openDispute(orderId, reasonCID);
  await tx.wait();
  return tx;
}

export async function resolveDispute(orderId, sellerFavor, providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? true);
  const tx = await contract.resolveDispute(orderId, sellerFavor);
  await tx.wait();
  return tx;
}

export const contractService = {
  createFarm,
  invest,
  getFarm,
  getFarms,
  disburseFunds,
  depositProceeds,
  claimInvestorPayout,
  getInvestorShares,
  getListings,
  purchase,
  getOrder,
  shipOrder,
  confirmReceived,
  releaseFunds,
  openDispute,
  resolveDispute
};