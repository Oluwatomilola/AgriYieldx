# AgriYield Faucet Setup Guide

## Overview

The AgriYield faucet allows users to claim test hUSDT tokens on Hedera Testnet. This guide explains how the faucet works and how to use it.

## How It Works

The faucet is implemented using the MockUSDT smart contract deployed on Hedera Testnet. Users can claim 1,000 hUSDT tokens once every 24 hours.

### Architecture

```
┌─────────────────┐
│   Frontend      │
│  (MetaMask)     │
│                 │
│ FaucetButton    │
└────────┬────────┘
         │
         │ Web3 Call
         │ (faucet function)
         ↓
┌─────────────────┐
│  MockUSDT.sol   │
│  Smart Contract │
│                 │
│ - Mint tokens   │
│ - Transfer      │
│ - Track         │
│   cooldown      │
└─────────────────┘
```

## Features

- **Automatic Cooldown Tracking**: Smart contract enforces 24-hour cooldown
- **Real-time Balance Updates**: See your balance immediately after claiming
- **MetaMask Integration**: Works seamlessly with MetaMask on Hedera Testnet
- **User-Friendly UI**: Clean interface with countdown timer
- **Error Handling**: Clear error messages for common issues

## Setup Instructions

### Prerequisites

1. **MetaMask Wallet**: Install MetaMask browser extension
2. **Hedera Testnet Configuration**: Add Hedera Testnet to MetaMask
3. **Test HBAR**: Get free HBAR from [Hedera Faucet](https://portal.hedera.com/faucet) for gas fees

### MetaMask Network Configuration

Add Hedera Testnet to MetaMask with these settings:

```
Network Name: Hedera Testnet
RPC URL: https://testnet.hashio.io/api
Chain ID: 296 (0x128 in hex)
Currency Symbol: HBAR
Block Explorer: https://hashscan.io/testnet
```

### Environment Configuration

1. Copy the example environment file:
```bash
cd frontend
cp .env.example .env
```

2. Update the `.env` file with your contract addresses:
```env
VITE_MOCK_USDT_ADDRESS=0x00000000000000000000000000000000006d3eca
VITE_AGRIYIELD_ADDRESS=0x380AAae7b3a9ec87Ff6A5CEd5e1a5110B591D7A5
VITE_MARKETPLACE_ADDRESS=0x7CA91C3c6B9B9d9d2F29eb0c5840D0D789987D22
VITE_FARM_SHARES_ADDRESS=0x661C2AbB83101dd1CDe57F5777C146862299416E
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id_here
```

## Using the Faucet

### Step 1: Connect Wallet

1. Navigate to `/faucet` page
2. Click "Connect Wallet" in the navbar
3. Select MetaMask and approve the connection
4. MetaMask will automatically switch to Hedera Testnet

### Step 2: Claim Tokens

1. Once connected, you'll see your current hUSDT balance
2. Click the "Claim 1,000 hUSDT" button
3. Approve the transaction in MetaMask
4. Wait for transaction confirmation (typically 2-5 seconds)
5. Your balance will update automatically

### Step 3: Use Tokens

After claiming tokens, you can:
- Invest in farm crowdfunding campaigns
- Purchase produce from the marketplace
- Test all platform features

## Cooldown System

The faucet implements a 24-hour cooldown period:

- **First Claim**: Immediate
- **Subsequent Claims**: Must wait 24 hours
- **Cooldown Tracking**: On-chain (persists across sessions)
- **Countdown Timer**: Shows remaining time in the UI

## Troubleshooting

### "Cooldown active" Error

**Problem**: Trying to claim before 24 hours have passed

**Solution**: Wait for the cooldown timer to reach zero

### "Insufficient HBAR for gas fees" Error

**Problem**: Not enough HBAR in wallet to pay for transaction

**Solution**:
1. Visit [Hedera Faucet](https://portal.hedera.com/faucet)
2. Enter your wallet address
3. Claim free test HBAR

### "Transaction rejected" Error

**Problem**: User rejected the transaction in MetaMask

**Solution**: Click the claim button again and approve the transaction

### "Wrong network" Error

**Problem**: MetaMask is not connected to Hedera Testnet

**Solution**:
1. Open MetaMask
2. Click the network dropdown
3. Select "Hedera Testnet"
4. If not listed, add it manually using the configuration above

### Balance Not Updating

**Problem**: Balance doesn't update after claiming

**Solution**:
1. Wait 5-10 seconds for blockchain confirmation
2. Refresh the page
3. Check transaction on [HashScan](https://hashscan.io/testnet)

## Technical Details

### Smart Contract Functions

#### `faucet(address to)`
Mints and transfers tokens to the specified address.

**Parameters**:
- `to`: Recipient address

**Requirements**:
- Cooldown period must have passed
- Caller must have sufficient HBAR for gas

**Events Emitted**:
- `FaucetClaimed(address indexed user, uint256 amount)`

#### `lastClaim(address user)`
Returns the timestamp of the last claim for a user.

**Returns**: `uint256` - Unix timestamp

#### `faucetAmount()`
Returns the amount distributed per claim.

**Returns**: `uint256` - Amount (1,000 * 10^6)

#### `faucetCooldown()`
Returns the cooldown period in seconds.

**Returns**: `uint256` - Cooldown (86400 seconds = 24 hours)

### Gas Costs

Typical gas costs on Hedera Testnet:

| Operation | Gas Used | Approx. Cost (HBAR) |
|-----------|----------|---------------------|
| First Claim | ~150,000 | ~$0.00015 USD |
| Subsequent Claims | ~50,000 | ~$0.00005 USD |

## Frontend Components

### FaucetButton Component

Location: `frontend/src/components/FaucetButton.jsx`

Features:
- Real-time balance display
- Cooldown countdown timer
- Transaction status feedback
- Error handling with user-friendly messages

### Faucet Page

Location: `frontend/src/pages/Faucet.jsx`

Features:
- Complete faucet interface
- How-to guide
- FAQ section
- Quick links to other platform features

## Integration with Other Features

### Investment in Farms

After claiming tokens, users can invest in farms:

```javascript
import { investInFarm } from './common/contractServices';

// Approve token spending first
await approveToken(signer, MOCK_USDT_ADDR, AGRIYIELD_ADDR, amount);

// Invest in farm
await investInFarm(signer, farmId, amount);
```

### Marketplace Purchases

Use tokens to buy produce:

```javascript
import { purchase } from './common/contractServices';

// Approve tokens
await approveToken(signer, MOCK_USDT_ADDR, MARKETPLACE_ADDR, totalCost);

// Make purchase
await purchase(signer, listingId, quantity);
```

## Security Considerations

1. **Testnet Only**: This faucet is for testnet only. Tokens have no real-world value.
2. **Rate Limiting**: 24-hour cooldown prevents abuse
3. **On-Chain Tracking**: Cooldown is enforced by smart contract, not frontend
4. **No KYC Required**: Faucet is open to all users for testing purposes

## API Reference

### Contract Services

```javascript
// Claim from faucet
await claimFaucet(signer, recipientAddress);

// Get user balance
const balance = await getTokenBalance(provider, tokenAddress, userAddress);

// Get last claim time
const lastClaim = await getLastClaim(provider, userAddress);

// Get faucet amount
const amount = await getFaucetAmount(provider);

// Get cooldown period
const cooldown = await getFaucetCooldown(provider);
```

## Support

For issues or questions:
- Check the FAQ section on the faucet page
- Review [Hedera Documentation](https://docs.hedera.com)
- Check transaction details on [HashScan](https://hashscan.io/testnet)

## Future Enhancements

Potential improvements for production:
- [ ] Multi-token support (HBAR, other HTS tokens)
- [ ] Adjustable faucet amounts based on user tier
- [ ] Transaction history
- [ ] Social sharing for cooldown bypass
- [ ] Admin dashboard for monitoring

---

**Note**: This faucet is part of the AgriYield testnet platform and should not be deployed to mainnet without proper security audits and rate limiting mechanisms.
