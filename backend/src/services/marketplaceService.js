import { ethers } from "ethers";
import MarketplaceABI from "../abis/Marketplace.json" with { type: "json" };

const MARKETPLACE_ADDR = process.env.MARKETPLACE_ADDR;
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const marketplace = new ethers.Contract(MARKETPLACE_ADDR, MarketplaceABI, wallet);

/**
 * ✅ Create a new listing (farmer only)
 */
export async function listItem(farmId, price, quantity, metadataCID) {
  const tx = await marketplace.listItem(farmId, price, quantity, metadataCID);
  const receipt = await tx.wait();
  return {
    txHash: receipt.transactionHash,
    listingId: receipt.logs[0]?.args?.listingId?.toString()
  };
}

/**
 * ✅ Update a listing (farmer only)
 */
export async function updateListing(listingId, price, quantity) {
  const tx = await marketplace.updateListing(listingId, price, quantity);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Deactivate a listing
 */
export async function deactivateListing(listingId) {
  const tx = await marketplace.deactivateListing(listingId);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Purchase produce (escrow held in contract)
 */
export async function purchase(listingId, quantity) {
  const tx = await marketplace.purchase(listingId, quantity);
  const receipt = await tx.wait();
  return {
    txHash: receipt.transactionHash,
    orderId: receipt.logs[0]?.args?.orderId?.toString()
  };
}

/**
 * ✅ Ship order (seller only)
 */
export async function shipOrder(orderId, shippingCID) {
  const tx = await marketplace.shipOrder(orderId, shippingCID);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Buyer confirms receipt
 */
export async function confirmReceived(orderId, proofCID) {
  const tx = await marketplace.confirmReceived(orderId, proofCID);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Buyer releases funds to seller
 */
export async function releaseFunds(orderId) {
  const tx = await marketplace.releaseFunds(orderId);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Open dispute (buyer only)
 */
export async function openDispute(orderId, reasonCID) {
  const tx = await marketplace.openDispute(orderId, reasonCID);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Resolve dispute (arbiter/admin only?)
 */
export async function resolveDispute(orderId, sellerFavor) {
  const tx = await marketplace.resolveDispute(orderId, sellerFavor);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

/**
 * ✅ Read listing
 */
export async function getListing(listingId) {
  const listing = await marketplace.getListing(listingId);
  return {
    farmId: listing.farmId.toString(),
    farmer: listing.farmer,
    price: listing.price.toString(),
    quantity: listing.quantity.toString(),
    quantityRemaining: listing.quantityRemaining.toString(),
    metadataCID: listing.metadataCID,
    isActive: listing.isActive
  };
}

/**
 * ✅ Read order
 */
export async function getOrder(orderId) {
  const order = await marketplace.getOrder(orderId);
  return {
    listingId: order.listingId.toString(),
    buyer: order.buyer,
    seller: order.seller,
    price: order.price.toString(),
    quantity: order.quantity.toString(),
    shippingCID: order.shippingCID,
    proofCID: order.proofCID,
    status: order.status,
    isDisputed: order.isDisputed,
    disputeReasonCID: order.disputeReasonCID
  };
}
