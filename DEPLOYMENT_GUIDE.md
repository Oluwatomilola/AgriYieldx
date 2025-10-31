# AgriYield Deployment Guide

## Complete Deployment Workflow

This guide walks you through deploying the AgriYield platform on Hedera Testnet with full faucet functionality.

## Prerequisites

- Node.js v18 or higher
- MetaMask browser extension
- Hedera testnet account with test HBAR
- Pinata account for IPFS (optional)
- WalletConnect Project ID

## Step 1: Environment Setup

### Backend Configuration

1. Navigate to backend directory:
```bash
cd backend
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Fill in your Hedera credentials:
```env
OPERATOR_ID=0.0.YOUR_ACCOUNT_ID
OPERATOR_KEY=your_hedera_private_key
HUSDT_TOKEN_ID=0.0.YOUR_TOKEN_ID  # Will be set after token creation
```

### Frontend Configuration

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Get a WalletConnect Project ID:
   - Visit https://cloud.walletconnect.com
   - Create a new project
   - Copy the Project ID

4. Update `.env`:
```env
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
VITE_API_URL=http://localhost:4000/api
```

## Step 2: Smart Contract Deployment

### Deploy Token (Option A: Native HTS Token - Recommended)

This creates a native Hedera Token Service token:

```bash
cd hardhat
npx hardhat run script/createHtsToken.ts --network hederaTestnet
```

**Output**:
```
Token created!
Token ID: 0.0.6918795
Token EVM Address: 0x000000000000000000000000000000000069928b
```

Save both the Token ID and EVM address.

### Deploy Token (Option B: MockUSDT Contract)

Alternative approach using a smart contract wrapper:

```bash
npx hardhat run script/deployMockUSDT.ts --network hederaTestnet
```

### Deploy Core Contracts

1. **Deploy FarmShares Contract**:
```bash
npx hardhat run script/deployFarmShares.ts --network hederaTestnet
```

2. **Deploy AgriYield Contract**:
```bash
# Set environment variables first
export FARM_SHARES_ADDRESS=0x...
export MOCK_USDT_ADDRESS=0x...
export ADMIN_EVM_ADDRESS=0x...

npx hardhat run script/deployAgriYield.ts --network hederaTestnet
```

3. **Deploy Marketplace Contract**:
```bash
export AGRI_YIELD_ADDRESS=0x...
export MOCK_USDT_ADDRESS=0x...

npx hardhat run script/deployMarketplace.ts --network hederaTestnet
```

## Step 3: Update Configuration Files

### Update Backend .env

```env
HUSDT_TOKEN_ID=0.0.6918795
MOCK_USDT_ADDRESS=0x000000000000000000000000000000000069928b
AGRIYIELD_ADDRESS=0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5
MARKETPLACE_ADDRESS=0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22
FARM_SHARES_ADDRESS=0x661C2AbB83101dd1CDe57F5777C146862299416E
```

### Update Frontend .env

```env
VITE_MOCK_USDT_ADDRESS=0x000000000000000000000000000000000069928b
VITE_AGRIYIELD_ADDRESS=0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5
VITE_MARKETPLACE_ADDRESS=0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22
VITE_FARM_SHARES_ADDRESS=0x661C2AbB83101dd1CDe57F5777C146862299416E
```

## Step 4: Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Step 5: Start Development Servers

### Backend Server

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:4000

### Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

## Step 6: Testing the Faucet

1. **Setup MetaMask**:
   - Add Hedera Testnet to MetaMask
   - Get test HBAR from https://portal.hedera.com/faucet

2. **Visit Faucet Page**:
   - Navigate to http://localhost:5173/faucet
   - Connect your MetaMask wallet

3. **Claim Tokens**:
   - Click "Claim 1,000 hUSDT"
   - Approve transaction in MetaMask
   - Wait for confirmation

4. **Verify Balance**:
   - Check your balance on the faucet page
   - Verify on HashScan: https://hashscan.io/testnet

## Step 7: Grant KYC (If Required)

If your token has KYC enabled, grant KYC to users:

```bash
cd hardhat
npx hardhat run script/grantKyc.ts --network hederaTestnet
```

Or use the MockUSDT contract's `grantKYC` function.

## Deployment Checklist

- [ ] Hedera testnet account created with HBAR
- [ ] Environment variables configured
- [ ] HTS token created or MockUSDT deployed
- [ ] FarmShares contract deployed
- [ ] AgriYield contract deployed
- [ ] Marketplace contract deployed
- [ ] All contract addresses added to .env files
- [ ] Backend server running
- [ ] Frontend server running
- [ ] MetaMask configured with Hedera Testnet
- [ ] Faucet tested and working
- [ ] KYC granted (if applicable)

## Troubleshooting

### Contract Deployment Fails

**Error**: Insufficient balance

**Solution**:
- Get more HBAR from Hedera faucet
- Check OPERATOR_KEY is correct

### Faucet Not Working

**Error**: "Not created" or contract not found

**Solution**:
1. Verify VITE_MOCK_USDT_ADDRESS is correct in frontend/.env
2. Check contract is deployed on HashScan
3. Ensure MetaMask is on Hedera Testnet (Chain ID 296)

### Token Transfer Fails

**Error**: "KYC not granted"

**Solution**:
- Run the grantKyc script for the user's account
- Or use MockUSDT.grantKYC(address) function

### "Wrong Network" Error

**Solution**:
1. Open MetaMask
2. Switch to Hedera Testnet
3. If not added, use these settings:
   - Network Name: Hedera Testnet
   - RPC: https://testnet.hashio.io/api
   - Chain ID: 296
   - Symbol: HBAR

## Production Deployment

For production (Hedera Mainnet):

1. **Security Audit**: Get contracts audited by professional firm
2. **Rate Limiting**: Implement stricter faucet limits or remove entirely
3. **Monitoring**: Set up logging and error tracking
4. **Domain**: Use proper domain instead of localhost
5. **SSL**: Enable HTTPS for all connections
6. **Environment**: Update RPC to mainnet
7. **Real Tokens**: Use real stablecoins, not mock tokens

### Mainnet Configuration

```env
# Hedera Mainnet
HEDERA_NETWORK=https://mainnet.hashio.io/api
VITE_RPC_URL=https://mainnet.hashio.io/api
VITE_CHAIN_ID=295
```

## Monitoring & Maintenance

### Check Contract Status

```bash
# View transaction on HashScan
https://hashscan.io/testnet/transaction/[TRANSACTION_ID]

# View contract details
https://hashscan.io/testnet/contract/[CONTRACT_ADDRESS]

# View token details
https://hashscan.io/testnet/token/[TOKEN_ID]
```

### Backend Logs

```bash
cd backend
tail -f logs/app.log  # If logging is configured
```

### Database Backup

The faucet cooldown data is stored in `backend/db/db.json`. Back it up regularly:

```bash
cp backend/db/db.json backend/db/db.backup.json
```

## Scaling Considerations

For production deployment:

1. **Database**: Migrate from JSON file to PostgreSQL/MongoDB
2. **Caching**: Add Redis for faster cooldown checks
3. **CDN**: Use CDN for frontend assets
4. **Load Balancer**: Deploy multiple backend instances
5. **Rate Limiting**: Add API rate limiting middleware
6. **Monitoring**: Set up Sentry or similar for error tracking

## Cost Estimates

### Hedera Testnet
- Token creation: Free (testnet)
- Contract deployment: ~0.5 HBAR per contract (free on testnet)
- Transactions: ~0.001 HBAR per transaction (free on testnet)

### Hedera Mainnet (Estimated)
- Token creation: ~$1 USD
- Contract deployment: ~$5-10 USD per contract
- Transactions: ~$0.001 USD per transaction

## Support Resources

- **Hedera Docs**: https://docs.hedera.com
- **HashScan Explorer**: https://hashscan.io/testnet
- **Hedera Discord**: https://hedera.com/discord
- **Hedera Portal**: https://portal.hedera.com

---

**Last Updated**: October 2025
**Version**: 1.0.0
