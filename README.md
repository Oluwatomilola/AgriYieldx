# AgriYield — NFT Receipt System on Hedera
A Hedera-powered prototype demonstrating on-chain proof of payments using HTS NFTs

AgriYield implements an NFT Receipt System where every major on-chain action — Invest, Disburse, Create Order, and Purchase — automatically generates a non-fungible HTS receipt token. These NFTs serve as permanent, tamper-proof proof of payments or actions across the AgriYield ecosystem.

This project also demonstrates a real-world agriculture financing & B2B marketplace use case powered by HSCS, HTS, and HCS.

## Problem Statement 

Basic Problem Statement (DeFi & Tokenization):

Build a dApp where every transaction mints an NFT receipt via HTS as proof of payment or action.

## Our Solution 

AgriYield demonstrates how Hedera’s stack can provide transparent, verifiable proof of interactions between investors, farmers, and buyers.

For every successful action, the backend listens to smart-contract events and mints a non-fungible HTS token containing:

farmId or orderId

action type (Invest, Disburse, Purchase)

amount

timestamp

from address

to address

This NFT is sent immediately to the user’s Hedera account, serving as a permanent digital receipt.

✔ Uses three Hedera services:

HTS → Mint fungible farm tokens + NFT receipts

HSCS → Smart contract logic (AgriYield + Marketplace)

HCS → Buyer ↔ Seller marketplace messaging

 ## How It Works
#1. User performs an on-chain action

Invest in a farm

Disburse funds to farmer

Create marketplace order

Complete purchase

2. AgriYield smart contract emits an event

#Example events used:
  event Invested(uint256 farmId, address investor, uint256 amount, uint256 shares);
  event FundsDisbursed(uint256 farmId, uint256 amount);
  event OrderCreated(orderId, listingId, buyer, farmer, totalPrice, quantity);
  event FundsReleased(orderId, seller, price);
  
3. Event Listener (Backend or Cloud Function)

  Detects event
  
  Builds metadata object
  
  Mints an HTS NFT
  
  Sends NFT to the triggering user

4. NFT Metadata (HTS)
    {
      "type": "Invest" | "Purchase" | "Disburse",
      "farmId": 3,
      "orderId": 12,
      "amount": 500,
      "timestamp": 1731268912,
      "from": "0x…",
      "to": "0x…"
    }
5. Wallet View
  
  User instantly sees their receipts in their Hedera account.

## Tech Stack
## Frontend

React + Vite

WalletConnect + Metamask

## Backend

Node.js / Express

Event Listener for HTS NFT minting

## Smart Contracts (HSCS)

  AgriYield.sol (Invest, Disburse, Claim)
  
  FarmShares ERC1155
  
  Marketplace.sol (Listing, Orders, Escrow, FundsReleased)

## Hedera Network

  HTS (Fungible tokens + NFT Receipts)
  
  HSCS (Smart contract service for business logic)
  
  HCS (Marketplace messaging between farmer & buyer)

# Data Storage
  
  IPFS for metadata
  
  Postgres optional for off-chain indexing

## Features 
✔ NFT Receipts for all actions

  Invest Receipt
  
  Disbursement Receipt
  
  Purchase Receipt
  
  Order Creation Receipt

Mapped to hackathon requirement of simple buttons triggering NFT minting.

  ✔ Full RWA logic (bonus)
  
  Tokenized farm shares (ERC1155)
  
  B2B marketplace escrow
  
  HCS conversation layer

## Installation & Running Locally
1. Clone repo
  git clone https://github.com/yusuf-abdoul/AgriYield.git
  cd AgriYield
2. Backend setup
   cd backend
   npm install
  Environment variables
  HEDERA_OPERATOR_ID=
  HEDERA_OPERATOR_KEY=
  RECEIPT_NFT_TOKEN_ID=
  RPC_URL=
  Start:
  npm start
3. Frontend setup
   cd ../frontend
  npm install
  npm run dev
  Open browser at:
  http://localhost:5173/

## 🎬 Demo Video  
Watch our demo (3 minutes): [[ Demo](https://youtu.be/acwf8uBW0oM)]  
This video shows how to signup, invest, claim, view NFTS minted



