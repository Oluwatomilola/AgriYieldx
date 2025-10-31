# AgriYieldX

## 🚀 Overview  
**AgriYieldX** is a prototype built on the Hedera Network to enable traceable, tokenised agricultural yield and asset flows — from input through harvest to market or financing.  
It targets small/medium-scale farmers, agribusiness suppliers, buyers and financiers looking to unlock value via transparent digital asset flows.

## 🎯 Problem  
Farmers struggle with finance, transparency and asset tracking: inputs are not fully tracked, expected vs actual yield mismatch is opaque, collateralisation is difficult, trust is low.  
Buyers and financiers operate with incomplete data, increasing risk and cost.  
AgriYieldX addresses this by using Hedera’s DLT to tokenise real-world assets and log lifecycle events immutably.

## 💡 Solution  
- Mint a “Yield Token” representing expected crop output.  
- Log key events (planting, fertilisation, harvesting) using Hedera Consensus Service for transparency and auditability.  
- Provide dashboard + transfer/financing flows so financiers/buyers can engage securely.  
- Enable improved yield insights, traceability, and financing options for agrifarms.

## 🧩 Architecture & Workflow  
1. Farmer signs in and registers a new asset (field, crop type, expected yield).  
2. Backend calls Hedera Token Service (HTS) to mint a token representing the asset.  
3. As farming events occur (planting, watering, harvest), backend logs events on Hedera Consensus Service (HCS) — each event has timestamp, description, asset-ID.  
4. Dashboard UI pulls data from backend + reads token state from Hedera.  
5. Token can be transferred to buyer/financier via smart contract logic, triggering settlement when “harvested” event logged.  
6. Dashboard for financiers shows token owner, asset lifecycle status, yield performance.

## 🛠️ Tech Stack  
- Frontend: React  
- Backend: Node.js / Express  
- Smart contracts: Solidity (Hardhat)  
- Hedera SDKs: Hedera Token Service (HTS), Hedera Consensus Service (HCS)  
- Data store: <e.g., PostgreSQL / MongoDB>  
- Environment: Hedera Testnet (or Mainnet if eligible)  

## 📋 Features  
- Asset registration & token minting  
- Lifecycle event logging (planting, fertilisation, harvest)  
- Dashboard view for farmers, buyers, financiers  
- Token transfer & conditional logic based on events  
- (Optional) Analytics: expected vs actual yield, performance graphs  

## 📝 Workflow Description  
- Policy: Only registered farmers can mint tokens; tokens represent physical assets and cannot be double-minted. Owning a token implies asset rights. Transfer logic enforces event conditions (e.g., harvest event must be logged before settlement).  
- Workflow: [see “Architecture & Workflow” above]  
- Comparative Analysis (optional): Traditional yield tracking uses spreadsheets/manual logs, lacks transparency; blockchain solutions exist (e.g., crop tracking + tokenisation) but few target small-scale farmers + are built on Hedera with both token & consensus services integrated.

## 🎬 Demo Video  
Watch our demo (3 minutes): [Insert YouTube/Vimeo/Public link]  
This video shows installation, how to mint a token, log events, transfer asset, and view dashboard.

## 📂 Installation & Running  
1. Clone repository  
bash
git clone https://github.com/yusuf-abdoul/AgriYieldX.git
cd AgriYieldX
Install dependencies (frontend + backend)

2. Install dependencies (frontend + backend)
cd backend && npm install  
cd ../frontend && npm install  

3. Set environment variables:
HEDERA_OPERATOR_ID=<your-operator-id>  
HEDERA_OPERATOR_KEY=<your-operator-key>  
DATABASE_URL=<your-db-url>  

4. Start backend:
cd backend && npm start

5. Start frontend:
cd frontend && npm start  

6. Use browser to navigate to http://localhost:3000 (or specified port) to register asset, view dashboard, etc.


## ✅ Requirements Compliance

Platform: Web app (frontend + backend) running on specified environment (Hedera Testnet).

Working consistency: All flows (mint token, log events, transfer) are functioning as shown in demo video.

Track: This aligns with Track 1 (Onchain Finance & Real-World Assets) per Hedera Hackathon rules.

New / significant update: Since hackathon start, we added Hedera integration (HTS & HCS), dashboard UI, token transfer logic.

Third-party integrations: Weather API (if used) is under licence XYZ, UI icons under MIT licence, documented in LICENSES.md.


## 🧾 What’s Next / Roadmap
-Expand to Hedera Mainnet deployment
-Add mobile app (React Native)
-Add DeFi features: yield-based loans, staking of tokens
-Expand analytics: yield prediction via AI/ML
-Integrate IoT sensors for field monitoring (for DLT for Operations track)

## 📄 License
This project is licensed under the MIT License. See LICENSE file for full details.

## 🙌 Acknowledgements
Thanks to the Hedera Hackathon team for organising this track and the SDK teams for open-source libraries.
