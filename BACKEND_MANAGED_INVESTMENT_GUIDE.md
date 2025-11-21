# Backend-Managed Investment Flow with MetaMask Authentication

## Overview

This document explains the new backend-managed investment flow that solves the HTS token transfer issue on Hedera. The system now uses:

1. **MetaMask Authentication** - Wallet-based login/signup using message signing
2. **Backend Token Transfers** - Hedera SDK handles HTS token transfers server-side
3. **JWT Authentication** - Secure API access with JSON Web Tokens

## Architecture

```
User Wallet (MetaMask)
    ↓
Frontend (React + Wagmi)
    ↓
Backend API (Express + Hedera SDK)
    ↓
Hedera Network (HTS + Smart Contracts)
```

## Authentication Flow

### 1. User Initiates Authentication

**Frontend:** User clicks "Sign In with MetaMask" on `/auth` page

**Process:**
1. Frontend requests nonce from backend: `POST /api/auth/nonce`
2. Backend generates random nonce and returns message to sign
3. Frontend prompts MetaMask to sign the message
4. User approves signature in MetaMask
5. Frontend sends signature to backend: `POST /api/auth/verify`
6. Backend verifies signature matches the address
7. Backend generates JWT token and returns it
8. Frontend stores token in localStorage

**Code Example (Frontend):**
```javascript
import { authenticateWithMetaMask } from './services/authService';

const signer = await provider.getSigner();
const result = await authenticateWithMetaMask(signer);

if (result.success) {
  // Token is automatically stored
  navigate('/investor');
}
```

### 2. Message Signing

The message format ensures security:
```
Sign this message to authenticate with AgriYield.

Nonce: 123456
Address: 0x1234...5678
```

- **Nonce**: Random number that expires in 5 minutes
- **Address**: User's wallet address
- **Purpose**: Proves wallet ownership without exposing private keys

## Investment Flow

### Step 1: User Initiates Investment

**Frontend:** User fills out investment amount in InvestmentModal

**Validation:**
- Amount must be > 0
- Amount must be multiple of share price
- User must be authenticated (or will be prompted to authenticate)

### Step 2: Authentication Check

**Frontend:** Checks if user has valid JWT token

**If not authenticated:**
1. Prompts MetaMask signature
2. Completes authentication flow
3. Stores JWT token
4. Proceeds with investment

### Step 3: Backend Processes Investment

**Frontend:** Calls `POST /api/farm/invest-backend` with JWT token

**Backend Process:**
```javascript
// 1. Verify JWT token
const decoded = verifyToken(token);

// 2. Convert EVM addresses to Hedera Account IDs
const investorAccountId = evmAddressToAccountId(userAddress);
const contractAccountId = evmAddressToAccountId(contractAddress);

// 3. Transfer tokens using Hedera SDK
const transferResult = await transferTokens(
  investorAccountId,
  contractAccountId,
  tokenId,
  amount
);

// 4. Call contract's invest() function
const investResult = await callInvestFunction(farmId, amount, userAddress);

// 5. Return transaction IDs
return {
  transferTxId: transferResult.transactionId,
  investTxId: investResult.transactionId
};
```

### Step 4: Success Response

**Frontend:** Displays success message with transaction IDs

**User sees:**
```
Investment successful!

Transfer TX: 0.0.123456@1234567890.123456789
Invest TX: 0.0.123456@1234567890.987654321

You have received your farm shares!
```

## API Endpoints

### Authentication

#### POST /api/auth/nonce
Request nonce for MetaMask authentication

**Request:**
```json
{
  "address": "0x1234567890abcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "nonce": "123456",
  "message": "Sign this message to authenticate with AgriYield.\n\nNonce: 123456\nAddress: 0x1234..."
}
```

#### POST /api/auth/verify
Verify signature and get JWT token

**Request:**
```json
{
  "address": "0x1234567890abcdef...",
  "signature": "0xabcdef..."
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "address": "0x1234567890abcdef...",
  "message": "Authentication successful"
}
```

#### GET /api/auth/me
Get current user info (protected)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "address": "0x1234567890abcdef..."
}
```

### Investment

#### POST /api/farm/invest-backend
Invest in a farm (protected)

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request:**
```json
{
  "farmId": "1",
  "amount": "100000000"
}
```

**Response:**
```json
{
  "success": true,
  "transferTxId": "0.0.123456@1234567890.123456789",
  "investTxId": "0.0.123456@1234567890.987654321",
  "message": "Investment successful! You have received your farm shares."
}
```

## Security Features

1. **Nonce Expiration**: Nonces expire after 5 minutes
2. **One-Time Use**: Each nonce can only be used once
3. **Signature Verification**: Backend verifies signature matches address
4. **JWT Expiration**: Tokens expire after 7 days
5. **Protected Routes**: Investment endpoints require valid JWT

## Environment Variables

### Backend (.env)
```
JWT_SECRET=agriyield-secret-key-change-in-production-2025
OPERATOR_ID=0.0.6853854
OPERATOR_KEY=302e020100300506032b657004220420...
HUSDT_TOKEN_ID=0.0.6918795
AGRIYIELD_ADDRESS=0x9566da5c64a0c9ac2561d633F02bFf867DEe51f2
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:4000/api
VITE_AGRIYIELD_ADDRESS=0x9566da5c64a0c9ac2561d633F02bFf867DEe51f2
VITE_MOCK_USDT_ADDRESS=0x000000000000000000000000000000000069928b
```

## Testing

See `TEST_REPORT.md` for comprehensive testing results.

## Troubleshooting

### "Not authenticated" error
- User needs to sign in with MetaMask first
- JWT token may have expired (7 days)
- Solution: Visit `/auth` page and sign in again

### "Token transfer failed" error
- Check backend has sufficient HBAR for gas fees
- Verify OPERATOR_ID and OPERATOR_KEY are correct
- Check token association on contract

### "Invalid signature" error
- Nonce may have expired (5 minutes)
- User may have rejected signature in MetaMask
- Solution: Try authentication again

## Next Steps

1. Test authentication flow with real MetaMask wallet
2. Test investment flow end-to-end
3. Deploy backend to production server
4. Update frontend to use production API URL
5. Add error handling and retry logic
6. Implement transaction status polling

