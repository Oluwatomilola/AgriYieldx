import { ethers, BrowserProvider } from "ethers";
import { agriYieldAbi } from "../assets/agriYieldAbi.js";
import ERC20_ABI from "../assets/erc20Abi.js";
import { marketPlaceAbi } from "../assets/marketPlaceAbi.js";

const CONTRACT_ADDRESSES = {
  agriYield: import.meta.env.VITE_AGRIYIELD_ADDRESS,
  marketplace: import.meta.env.VITE_MARKETPLACE_ADDRESS,
  mockUsdt: import.meta.env.VITE_MOCK_USDT_ADDRESS
};

// Normalize IPFS links from various formats to { cid, path }
// Supports: ipfs://CID[/path], https://gateway/ipfs/CID[/path], https://CID.ipfs.gateway[/path],
// and plain "CID[/path]" strings.
function parseIpfsLink(value) {
  if (!value) return { cid: "", path: "" };
  const s = String(value).trim();
  // ipfs://CID/path
  const ipfsMatch = s.match(/^ipfs:\/\/([^/?#]+)(?:\/([^?#]*))?/i);
  if (ipfsMatch) return { cid: ipfsMatch[1], path: ipfsMatch[2] || "" };
  // https://host/ipfs/CID/path
  const httpMatch = s.match(/^https?:\/\/[^/]+\/ipfs\/([^/?#]+)(?:\/([^?#]*))?/i);
  if (httpMatch) return { cid: httpMatch[1], path: httpMatch[2] || "" };
  // https://CID.ipfs.host/path
  const subMatch = s.match(/^https?:\/\/([^.]+)\.ipfs\.[^/]+(?:\/([^?#]*))?/i);
  if (subMatch) return { cid: subMatch[1], path: subMatch[2] || "" };
  // Plain CID[/path]
  const parts = s.split("/");
  const cid = parts[0];
  const path = parts.slice(1).join("/");
  return { cid, path };
}

async function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) return undefined;
  // Use wallet’s EIP-1193 provider for all interactions to avoid RPC timeouts
  return new BrowserProvider(window.ethereum);
}

async function getSigner() {
  const provider = await getProvider();
  if (!provider) return undefined;
  try { await provider.send('eth_requestAccounts', []); } catch { void 0; }
  return provider.getSigner();
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
    if (!resolved) {
      resolved = new ethers.JsonRpcProvider(import.meta.env.VITE_RPC_URL);
    }
  } else {
    resolved = providerOrSigner;
  }

  return new ethers.Contract(CONTRACT_ADDRESSES.marketplace, marketPlaceAbi, resolved);
}

export async function getMarketplaceAgriYield(providerOrSigner = null) {
  const contract = await getMarketplaceContract(providerOrSigner ?? null);
  try {
    return await contract.agriYield();
  } catch {
    return undefined;
  }
}

export async function createFarm(goal, shares, price, cid, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? true);

  // Convert to HUSDT smallest units (6 decimals) for goal and share price
  const goalInUnits = ethers.parseUnits(goal.toString(), 6);
  const priceInUnits = ethers.parseUnits(price.toString(), 6);

  const tx = await contract.createFarm(goalInUnits, BigInt(shares), priceInUnits, cid);
  await tx.wait();
  return tx;
}

/**
 * Invest HUSDT in a farm using the standard ERC-20 approve + invest pattern:
 * Step 1: Check HUSDT balance
 * Step 2: Approve AgriYield contract to spend HUSDT tokens
 * Step 3: Call AgriYield contract's invest() function to transfer tokens and mint shares
 *
 * Note: HTS tokens support the ERC-20 interface, so this standard pattern works seamlessly.
 *
 * @param {number} farmId - The farm ID to invest in
 * @param {BigInt} amount - The amount of HUSDT to invest (in smallest units, 6 decimals)
 * @param {object} providerOrSigner - (unused) The signer to use for authentication
 * @returns {object} - Object containing transaction hash and success status
 */
export async function invest(farmId, amount, providerOrSigner = null) {
  void providerOrSigner;
  console.log("Starting HUSDT investment flow...");
  console.log("Farm ID:", farmId);
  console.log("Amount (raw):", amount);

  // Get signer (user's wallet)
  const signer = await getSigner();
  if (!signer) {
    throw new Error("Please connect your wallet to invest");
  }

    const userAddress = await signer.getAddress();
    console.log("Investor address:", userAddress);

  try {
    // Ensure amount is BigInt (in 6 decimals - HUSDT native decimals)
    const amount6Decimals = typeof amount === 'bigint' ? amount : BigInt(amount);
    console.log("Amount in HUSDT (6 decimals):", amount6Decimals.toString());
    console.log("Amount in HUSDT:", ethers.formatUnits(amount6Decimals, 6));

    // Ensure farmId is a number
    const farmIdNum = Number(farmId);
    console.log("Farm ID:", farmIdNum);

    const erc20 = new ethers.Contract(CONTRACT_ADDRESSES.mockUsdt, ERC20_ABI, signer);
    const currentAllowance = await erc20.allowance(userAddress, CONTRACT_ADDRESSES.agriYield);
    if (currentAllowance < amount6Decimals) {
      const approveTx = await erc20.approve(CONTRACT_ADDRESSES.agriYield, amount6Decimals);
      await approveTx.wait();
    }

    console.log("Calling invest on AgriYield contract (HTS transfer)...");
    console.log("Farm ID:", farmIdNum);
    console.log("Amount:", ethers.formatUnits(amount6Decimals, 6), "HUSDT");
    console.log("Please confirm the investment transaction in MetaMask");

    const agriYieldContract = await getAgriYieldContract(signer);

  // Try to estimate gas first to get better error messages
  try {
      const gasEstimate = await agriYieldContract.invest.estimateGas(farmIdNum, amount6Decimals);
      console.log("Gas estimate:", gasEstimate.toString());
  } catch {
      console.warn("Gas estimation failed (HTS precompile often fails under static call). Proceeding to send tx.");
  }

    const investTx = await agriYieldContract.invest(farmIdNum, amount6Decimals);
    console.log("Investment transaction sent:", investTx.hash);

    const investReceipt = await investTx.wait();
    console.log("✅ Investment successful!");

    return {
      success: true,
      transactionHash: investReceipt.hash,
      farmId: farmId.toString(),
      amount: ethers.formatUnits(amount6Decimals, 6)
    };
  } catch (err) {
    console.error("Investment error:", err);
    let msg = err?.message || String(err);

    // Provide helpful error messages
    if (msg.toUpperCase().includes("KYC")) {
      msg = "KYC not granted. Use the Faucet page to complete KYC, then try again.";
    } else if (msg.toUpperCase().includes("ASSOCIATE")) {
      msg = "Token not associated. Open your wallet and associate hUSDT (see Faucet page for token ID).";
    } else if (msg.toLowerCase().includes("insufficient")) {
      msg = "Insufficient HUSDT balance. Claim more from the Faucet page.";
    } else if (msg.includes("user rejected") || msg.includes("User denied")) {
      msg = "Transaction was rejected by user.";
    }

    throw new Error(msg);
  }
}

export async function getFarm(farmId, providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? null);
  return await contract.getFarm(farmId);
}

export async function getFarms(providerOrSigner = null) {
  const contract = await getAgriYieldContract(providerOrSigner ?? null);
  const farmCount = await contract.farmCount();
  const farms = [];
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

  for (let i = 1; i <= farmCount; i++) {
    try {
      const farm = await contract.getFarm(i);

      // Convert BigInt values to strings/numbers
      const farmData = {
        id: i,
        farmer: farm.farmer,
        fundingGoal: farm.fundingGoal.toString(),
        raised: farm.raised.toString(),
        proceeds: farm.proceeds ? farm.proceeds.toString() : '0',
        shareSupply: farm.shareSupply.toString(),
        sharePrice: farm.sharePrice.toString(),
        status: Number(farm.status),
        metaCID: farm.metaCID
      };

      // Fetch metadata from IPFS if available
      if (farm.metaCID) {
        try {
          // Normalize metaCID which may be ipfs://CID, CID/path, or full gateway URL
          const { cid: metaCid, path: metaPath } = parseIpfsLink(farm.metaCID);
          const metadataUrl = `${API_URL}/ipfs/${metaCid}${metaPath ? `?path=${encodeURIComponent(metaPath)}` : ''}`;

          const metadataResponse = await fetch(metadataUrl);
          if (metadataResponse.ok) {
            const metadata = await metadataResponse.json();
            farmData.name = metadata.name;
            farmData.description = metadata.description;

            // Construct proper image URL from CID or ipfs://CID
            if (metadata.image) {
              const { cid: imageCid, path: imagePath } = parseIpfsLink(metadata.image);
              farmData.image = `${API_URL}/ipfs/raw/${imageCid}${imagePath ? `?path=${encodeURIComponent(imagePath)}` : ''}`;
            }
          }
        } catch (err) {
          console.error(`Failed to fetch metadata for farm ${i}:`, err);
        }
      }

      farms.push(farmData);
    } catch (err) {
      console.error(`Error fetching farm ${i}:`, err);
    }
  }

  try {
    const seen = new Set();
    const unique = [];
    for (const f of farms) {
      const n = String((f.name || '').toLowerCase().trim());
      if (n && !seen.has(n)) {
        seen.add(n);
        unique.push(f);
      }
    }
    return unique;
  } catch {
    return farms;
  }
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

export async function listItem(farmId, price, quantity, metadataCID) {
  const signer = await getSigner();
  if (!signer) throw new Error("Please connect your wallet to list a product");
  const userAddress = await signer.getAddress();

  const agri = await getAgriYieldContract(signer);
  // Verify marketplace is pointing to the same AgriYield as frontend env
  const linkedAgriYield = await getMarketplaceAgriYield(null);
  if (linkedAgriYield && linkedAgriYield.toLowerCase() !== CONTRACT_ADDRESSES.agriYield.toLowerCase()) {
    throw new Error(`Marketplace is linked to a different AgriYield: ${linkedAgriYield}`);
  }
  const farm = await agri.getFarm(farmId);

  if (farm.farmer.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error("Only the farm owner can create listings for this farm");
  }
  // Marketplace contract does NOT require farm status to be Settled
  // Only ownership, price>0 and qty>0 are enforced on-chain.
  if (!price || price === 0n) throw new Error("Price must be greater than 0");
  if (!quantity || quantity === 0n) throw new Error("Quantity must be greater than 0");
  if (!metadataCID || String(metadataCID).trim().length === 0) {
    throw new Error("Metadata CID is required");
  }

  const contract = await getMarketplaceContract(signer);
  try {
    await contract.listItem.staticCall(
      farmId,
      price,
      quantity,
      metadataCID
    );
  } catch (e) {
    const reason = (e && (e.reason || e.shortMessage || e.message)) || "Unknown revert";
    console.warn("listItem static call failed (will proceed to send tx)", {
      farmId,
      price: price?.toString?.() ?? String(price),
      quantity: quantity?.toString?.() ?? String(quantity),
      metadataCID,
      linkedAgriYield,
      farmFarmer: farm.farmer,
      userAddress,
      reason
    });
  }
  const iface = new ethers.Interface(marketPlaceAbi);
  const data = iface.encodeFunctionData('listItem', [farmId, price, quantity, metadataCID]);
  console.log('listItem calldata', data.slice(0, 10), data.length);
  const tx = await signer.sendTransaction({
    to: CONTRACT_ADDRESSES.marketplace,
    data,
    gasLimit: 3000000n
  });
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
  resolveDispute,
  listItem
};