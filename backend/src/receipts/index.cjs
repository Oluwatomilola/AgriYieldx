"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initReceiptListeners = initReceiptListeners;
exports.attachReceiptsRoutes = attachReceiptsRoutes;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const agriYieldListener_1 = require("./listeners/agriYieldListener.cjs");
const marketplaceListener_1 = require("./listeners/marketplaceListener.cjs");
const receipts_1 = require("./db/receipts.cjs");
const addressMapper_1 = require("./services/addressMapper.cjs");
const nftMinter_1 = require("./services/nftMinter.cjs");
const ethers_1 = require("ethers");
const metadataBuilder_1 = require("./services/metadataBuilder.cjs");
const nftMinter_2 = require("./services/nftMinter.cjs");
function initReceiptListeners() {
    const rpcUrl = String(process.env.RPC_URL || "https://testnet.hashio.io/api");
    const agriAddress = process.env.AGRIYIELD_ADDRESS ? String(process.env.AGRIYIELD_ADDRESS) : "";
    const mpAddress = process.env.MARKETPLACE_ADDRESS ? String(process.env.MARKETPLACE_ADDRESS) : "";
    if (ethers_1.ethers.isAddress(agriAddress))
        (0, agriYieldListener_1.startAgriYieldListener)(rpcUrl, agriAddress);
    if (ethers_1.ethers.isAddress(mpAddress))
        (0, marketplaceListener_1.startMarketplaceListener)(rpcUrl, mpAddress);
}
function attachReceiptsRoutes(app, basePath = "") {
    const router = express_1.default.Router();
    router.use(express_1.default.json());
    router.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        if (req.method === "OPTIONS")
            return res.sendStatus(200);
        next();
    });
    router.get("/receipts", (req, res) => {
        const owner = String(req.query.owner || "");
        if (!owner)
            return res.status(400).json({ error: "owner required" });
        const recs = (0, receipts_1.getReceiptsByOwner)(owner);
        res.json(recs);
    });
    router.get("/receipts/tx/:hash", (req, res) => {
        const hash = String(req.params.hash);
        const rec = (0, receipts_1.getReceiptByTx)(hash);
        if (!rec)
            return res.status(404).json({ error: "not found" });
        res.json(rec);
    });
    router.post("/mapping", async (req, res) => {
        try {
            const { evm, accountId } = req.body || {};
            if (!evm)
                return res.status(400).json({ error: "evm required" });
            let acct = String(accountId || "").trim();
            if (!acct) {
                const url = `https://testnet.mirrornode.hedera.com/api/v1/accounts/${String(evm)}`;
                const resp = await fetch(url);
                if (!resp.ok)
                    return res.status(404).json({ error: "account not found" });
                const data = await resp.json();
                acct = String(data.account || "");
                if (!acct)
                    return res.status(404).json({ error: "account not found" });
            }
            (0, addressMapper_1.setMapping)(String(evm), acct);
            await (0, nftMinter_1.processPendingForEvm)(String(evm));
            res.json({ ok: true, accountId: acct });
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/reprocess/tx/:hash", async (req, res) => {
        try {
            const hash = String(req.params.hash);
            const rpcUrl = String(process.env.RPC_URL || "https://testnet.hashio.io/api");
            const agriAddress = process.env.AGRIYIELD_ADDRESS ? String(process.env.AGRIYIELD_ADDRESS) : "";
            const mpAddress = process.env.MARKETPLACE_ADDRESS ? String(process.env.MARKETPLACE_ADDRESS) : "";
            const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
            const receipt = await provider.getTransactionReceipt(hash);
            if (!receipt)
                return res.status(404).json({ error: "tx not found" });
            const agriIface = new ethers_1.ethers.Interface([
                "event Invested(uint256 indexed farmId, address indexed investor, uint256 amount, uint256 shares)",
                "event FundsDisbursed(uint256 indexed farmId, uint256 amount)",
                "event InvestorClaimed(uint256 indexed farmId, address indexed investor, uint256 payout)"
            ]);
            const mpIface = new ethers_1.ethers.Interface([
                "event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, address seller, uint256 price, uint256 quantity)",
                "event FundsReleased(uint256 indexed orderId, address indexed seller, uint256 amount)"
            ]);
            const agriContract = ethers_1.ethers.isAddress(agriAddress) ? new ethers_1.ethers.Contract(agriAddress, ["function getFarm(uint256) view returns (tuple(address farmer,uint256,uint256,uint256,uint256,uint256,uint8,string))"], provider) : null;
            let processed = 0;
            for (const log of receipt.logs) {
                let parsed;
                try {
                    parsed = agriIface.parseLog(log);
                }
                catch { }
                if (parsed && parsed.name === "Invested") {
                    const [farmId, investor, amount, shares] = parsed.args;
                    const block = await provider.getBlock(receipt.blockNumber);
                    const metadata = (0, metadataBuilder_1.buildInvestmentReceipt)(Number(farmId), String(investor), String(amount.toString()), Number(shares), hash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_2.mintAndTransfer)(metadata, String(investor), hash);
                    processed++;
                }
                if (parsed && parsed.name === "FundsDisbursed") {
                    const [farmId, amount] = parsed.args;
                    const block = await provider.getBlock(receipt.blockNumber);
                    let farmer = "";
                    if (agriContract) {
                        const farm = await agriContract.getFarm(Number(farmId));
                        farmer = String(farm.farmer);
                    }
                    const metadata = (0, metadataBuilder_1.buildDisbursementReceipt)(Number(farmId), farmer, String(amount.toString()), hash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_2.mintAndTransfer)(metadata, farmer || null, hash);
                    processed++;
                }
                if (parsed && parsed.name === "InvestorClaimed") {
                    const [farmId, investor, payout] = parsed.args;
                    const block = await provider.getBlock(receipt.blockNumber);
                    const metadata = (0, metadataBuilder_1.buildClaimReceipt)(Number(farmId), String(investor), String(payout.toString()), hash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_2.mintAndTransfer)(metadata, String(investor), hash);
                    processed++;
                }
                if (ethers_1.ethers.isAddress(mpAddress) && log.address.toLowerCase() === mpAddress.toLowerCase()) {
                    let parsed;
                    try {
                        parsed = mpIface.parseLog(log);
                    }
                    catch { }
                    if (parsed && parsed.name === "FundsReleased") {
                        processed++;
                    }
                }
            }
            res.json({ ok: true, processed });
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/repair/tx/:hash", async (req, res) => {
        try {
            const hash = String(req.params.hash);
            const rec = await (0, nftMinter_2.mintExistingReceipt)(hash);
            if (!rec)
                return res.status(404).json({ error: "receipt not found or owner unmapped" });
            res.json(rec);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/resolve/tx/:hash", async (req, res) => {
        try {
            const hash = String(req.params.hash);
            const rec = await (0, nftMinter_2.resolveSerialFromMirror)(hash);
            if (!rec)
                return res.status(404).json({ error: "receipt not found or not owned" });
            res.json(rec);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.get("/token", async (_req, res) => {
        try {
            const tokenId = await (0, nftMinter_2.getOrCreateTokenId)();
            res.json({ tokenId });
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/simulate/order", async (req, res) => {
        try {
            const { orderId, listingId, buyer, seller, pricePaid, quantity, txHash, timestamp } = req.body || {};
            if (!orderId || !listingId || !buyer || !seller || !pricePaid || !quantity || !txHash) {
                return res.status(400).json({ error: "orderId, listingId, buyer, seller, pricePaid, quantity, txHash required" });
            }
            if (!ethers_1.ethers.isAddress(String(buyer))) {
                return res.status(400).json({ error: "invalid buyer address" });
            }
            const ts = Number(timestamp || Math.floor(Date.now() / 1000));
            const meta = (0, metadataBuilder_1.buildPurchaseReceipt)(Number(orderId), Number(listingId), String(buyer), String(seller), String(pricePaid), Number(quantity), String(txHash), ts);
            const rec = await (0, nftMinter_2.mintAndTransfer)(meta, String(buyer), String(txHash));
            res.json(rec);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    router.post("/simulate/invest", async (req, res) => {
        try {
            const { farmId, investor, amount, shares, txHash, timestamp } = req.body || {};
            if (!farmId || !investor || !amount || !shares || !txHash) {
                return res.status(400).json({ error: "farmId, investor, amount, shares, txHash required" });
            }
            if (!ethers_1.ethers.isAddress(String(investor))) {
                return res.status(400).json({ error: "invalid investor address" });
            }
            const ts = Number(timestamp || Math.floor(Date.now() / 1000));
            const meta = (0, metadataBuilder_1.buildInvestmentReceipt)(Number(farmId), String(investor), String(amount), Number(shares), String(txHash), ts);
            const rec = await (0, nftMinter_2.mintAndTransfer)(meta, String(investor), String(txHash));
            res.json(rec);
        }
        catch (e) {
            res.status(500).json({ error: String(e?.message || e) });
        }
    });
    app.use(basePath, router);
}