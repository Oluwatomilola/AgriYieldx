# AgriYield Smart Contract Deployment & Token Association Guide

## Overview

This guide explains how to deploy the AgriYield smart contracts to Hedera Testnet and associate them with the HUSDT (Hedera USD Tether) token. Token association is **critical** for contracts to interact with HTS (Hedera Token Service) tokens.

## Prerequisites

1. Node.js 18+ installed
2. Hedera Testnet account with HBAR for gas fees
3. HUSDT token already created (Token ID: 0.0.6918795)
4. Private key with admin rights

## Environment Setup

Create or update `hardhat/.env`:

```env
# Hedera Configuration
OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
OPERATOR_KEY=your_private_key_here
HEDERA_NETWORK=testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api

# Token Configuration
HUSDT_TOKEN_ID=0.0.6918795
MOCK_USDT_ADDRESS=0x00000000000000000000000000000000006d3eca

# Admin Address (EVM format)
ADMIN_EVM_ADDRESS=0xYOUR_ADMIN_ADDRESS
```

## Deployment Options

### Option 1: Fresh Deployment with Auto-Association (Recommended)

Deploy all contracts and automatically associate them with HUSDT:

```bash
cd hardhat
npm install
npx hardhat run scripts/deploy-and-associate.js --network hederaTestnet
```

This script will:
1. Deploy FarmShares contract
2. Deploy AgriYield contract
3. Deploy Marketplace contract
4. Set AgriYield as FarmShares controller
5. **Associate AgriYield with HUSDT token**
6. **Associate Marketplace with HUSDT token**

### Option 2: Associate Existing Contracts

If contracts are already deployed but not associated:

```bash
cd hardhat
npx hardhat run scripts/associate-existing-contracts.js --network hederaTestnet
```

Make sure your `.env` has the correct contract addresses:
```env
AGRI_YIELD_ADDRESS=0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5
MARKETPLACE_ADDRESS=0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22
```

## Contract Modifications

The following functions were added to enable token association:

### AgriYield.sol
```solidity
function associateToken() external onlyAdmin {
    int response = HTS.associateToken(address(this), tokenAddress);
    require(response == HederaResponseCodes.SUCCESS, "AgriYield: token association failed");
    emit TokenAssociated(tokenAddress);
}
```

### Marketplace.sol
```solidity
function associateToken() external onlyAdmin {
    int response = HTS.associateToken(address(this), stableToken);
    require(response == HederaResponseCodes.SUCCESS, "Marketplace: token association failed");
    emit TokenAssociated(stableToken);
}
```

## Verification on HashScan

After deployment, verify your contracts on HashScan:

1. Visit https://hashscan.io/testnet
2. Search for your contract address
3. Check the "Contract" tab to see verified source code
4. Check the "Tokens" tab to confirm HUSDT association

## Backend Token Association API

The backend provides REST endpoints to check and manage token associations:

### Check Association Status
```bash
GET http://localhost:4000/api/association/check/0xCONTRACT_ADDRESS
```

Response:
```json
{
  "contractAddress": "0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5",
  "isAssociated": true,
  "tokenId": "0.0.6918795"
}
```

### Get Contract Token Balance
```bash
GET http://localhost:4000/api/association/balance/0xCONTRACT_ADDRESS
```

Response:
```json
{
  "contractAddress": "0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5",
  "balance": "5000000000",
  "tokenId": "0.0.6918795",
  "balanceFormatted": "5000.00 HUSDT"
}
```

### Associate All Contracts (Admin Only)
```bash
POST http://localhost:4000/api/association/all
```

## Troubleshooting

### Error: "TOKEN_ALREADY_ASSOCIATED_TO_ACCOUNT"
This is actually good! It means the contract is already associated with the token.

### Error: "INVALID_SIGNATURE"
- Check that your OPERATOR_KEY matches your OPERATOR_ID
- Ensure you're using the correct private key format (hex without 0x prefix)

### Error: "INSUFFICIENT_TX_FEE"
- Your account needs more HBAR for gas fees
- Get free testnet HBAR from https://portal.hedera.com/

### Error: "Contract not found"
- Verify the contract address is correct
- Check that you're on the right network (testnet vs mainnet)
- Wait a few seconds for the contract to be indexed by the mirror node

## Post-Deployment Checklist

- [ ] All contracts deployed successfully
- [ ] AgriYield associated with HUSDT token
- [ ] Marketplace associated with HUSDT token
- [ ] Contract addresses updated in all `.env` files:
  - `hardhat/.env`
  - `backend/.env`
  - `frontend/.env`
- [ ] Contracts verified on HashScan
- [ ] Test investment flow works
- [ ] Test marketplace purchase flow works

## Update Environment Files

After successful deployment, update these files:

### hardhat/.env
```env
FARM_SHARES_ADDRESS=0xNEW_ADDRESS
AGRIYIELD_ADDRESS=0xNEW_ADDRESS
MARKETPLACE_ADDRESS=0xNEW_ADDRESS
```

### backend/.env
```env
AGRIYIELD_ADDRESS=0xNEW_ADDRESS
MARKETPLACE_ADDRESS=0xNEW_ADDRESS
FARM_SHARES_ADDRESS=0xNEW_ADDRESS
```

### frontend/.env
```env
VITE_AGRIYIELD_ADDRESS=0xNEW_ADDRESS
VITE_MARKETPLACE_ADDRESS=0xNEW_ADDRESS
VITE_FARM_SHARES_ADDRESS=0xNEW_ADDRESS
```

## Next Steps

1. Start the backend server: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Test the full flow:
   - Connect wallet
   - Claim HUSDT from faucet
   - Invest in a farm
   - Create marketplace listing
   - Purchase from marketplace

## Support

For issues or questions:
- Check HashScan for transaction details
- Review backend logs for API errors
- Check browser console for frontend errors
- Verify all environment variables are set correctly

