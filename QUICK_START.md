# AgriYield Quick Start Guide

Get your faucet running in 5 minutes!

## Prerequisites

- Node.js installed
- MetaMask browser extension
- Test HBAR from [Hedera Faucet](https://portal.hedera.com/faucet)

## 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

## 2. Start Servers

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

## 3. Configure MetaMask

Add Hedera Testnet to MetaMask:

- **Network Name**: Hedera Testnet
- **RPC URL**: `https://testnet.hashio.io/api`
- **Chain ID**: `296`
- **Currency**: HBAR
- **Explorer**: `https://hashscan.io/testnet`

## 4. Use the Faucet

1. Open http://localhost:5173/faucet
2. Click "Connect Wallet"
3. Select MetaMask
4. Click "Claim 1,000 hUSDT"
5. Approve in MetaMask
6. Done! ✅

## Troubleshooting

### "Insufficient HBAR"
Get free HBAR: https://portal.hedera.com/faucet

### "Wrong Network"
Switch MetaMask to Hedera Testnet (Chain ID 296)

### "Cooldown Active"
Wait 24 hours between claims

## What's Next?

- Invest in farms: http://localhost:5173/farms
- Visit marketplace: http://localhost:5173/marketplace
- Check your dashboard: http://localhost:5173/investor

## Environment Variables

Your `.env` files are already configured! If you need to update them:

**Frontend** (`frontend/.env`):
- `VITE_MOCK_USDT_ADDRESS` - Already set ✅
- `VITE_WALLET_CONNECT_PROJECT_ID` - Already set ✅

**Backend** (`backend/.env`):
- `HUSDT_TOKEN_ID` - Already set ✅
- `OPERATOR_ID` - Already set ✅

## Support

- Read [FAUCET_SETUP.md](./FAUCET_SETUP.md) for detailed guide
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for deployment help
- View [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for technical details

---

**That's it!** You're ready to start using the faucet. 🎉
