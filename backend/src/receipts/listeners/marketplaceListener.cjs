"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMarketplaceListener = startMarketplaceListener;
const ethers_1 = require("ethers");
const metadataBuilder_1 = require("../services/metadataBuilder.cjs");
const nftMinter_1 = require("../services/nftMinter.cjs");
const mpAbi = [
    "event OrderCreated(uint256 indexed orderId, uint256 indexed listingId, address indexed buyer, address seller, uint256 price, uint256 quantity)",
    "event FundsReleased(uint256 indexed orderId, address indexed seller, uint256 amount)"
];
const orders = new Map();
function startMarketplaceListener(rpcUrl, mpAddress) {
    const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers_1.ethers.Contract(mpAddress, mpAbi, provider);
    (async () => {
        try {
            const latest = await provider.getBlockNumber();
            const from = Math.max(latest - 2000, 0);
            const orderCreatedTopic = ethers_1.ethers.id("OrderCreated(uint256,uint256,address,address,uint256,uint256)");
            const orderCreated = await provider.getLogs({ address: mpAddress, fromBlock: from, toBlock: latest, topics: [orderCreatedTopic] });
            for (const ev of orderCreated) {
                const block = await provider.getBlock(ev.blockNumber);
                const parsed = contract.interface.parseLog(ev);
                if (!parsed)
                    continue;
                const [orderId, listingId, buyer, seller, price, quantity] = parsed.args;
                orders.set(Number(orderId), {
                    listingId: Number(listingId),
                    buyer: String(buyer),
                    seller: String(seller),
                    price: String(price.toString()),
                    quantity: Number(quantity),
                    txHash: ev.transactionHash,
                    ts: Number(block?.timestamp || Math.floor(Date.now() / 1000))
                });
            }
            const fundsReleasedTopic = ethers_1.ethers.id("FundsReleased(uint256,address,uint256)");
            const fundsReleased = await provider.getLogs({ address: mpAddress, fromBlock: from, toBlock: latest, topics: [fundsReleasedTopic] });
            for (const ev of fundsReleased) {
                const block = await provider.getBlock(ev.blockNumber);
                const parsed = contract.interface.parseLog(ev);
                if (!parsed)
                    continue;
                const [orderId, seller, amount] = parsed.args;
                const od = orders.get(Number(orderId));
                if (!od)
                    continue;
                const metadata = (0, metadataBuilder_1.buildPurchaseReceipt)(Number(orderId), od.listingId, od.buyer, String(seller), od.price, od.quantity, ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                await (0, nftMinter_1.mintAndTransfer)(metadata, od.buyer, ev.transactionHash);
            }
        }
        catch { }
    })();
    (async () => {
        let last = await provider.getBlockNumber();
        const orderCreatedTopic = ethers_1.ethers.id("OrderCreated(uint256,uint256,address,address,uint256,uint256)");
        const fundsReleasedTopic = ethers_1.ethers.id("FundsReleased(uint256,address,uint256)");
        setInterval(async () => {
            try {
                const latest = await provider.getBlockNumber();
                const from = last + 1;
                if (from > latest)
                    return;
                const ordLogs = await provider.getLogs({ address: mpAddress, fromBlock: from, toBlock: latest, topics: [orderCreatedTopic] });
                for (const ev of ordLogs) {
                    const block = await provider.getBlock(ev.blockNumber);
                    const parsed = contract.interface.parseLog(ev);
                    if (!parsed)
                        continue;
                    const [orderId, listingId, buyer, seller, price, quantity] = parsed.args;
                    orders.set(Number(orderId), {
                        listingId: Number(listingId),
                        buyer: String(buyer),
                        seller: String(seller),
                        price: String(price.toString()),
                        quantity: Number(quantity),
                        txHash: ev.transactionHash,
                        ts: Number(block?.timestamp || Math.floor(Date.now() / 1000))
                    });
                }
                const relLogs = await provider.getLogs({ address: mpAddress, fromBlock: from, toBlock: latest, topics: [fundsReleasedTopic] });
                for (const ev of relLogs) {
                    const block = await provider.getBlock(ev.blockNumber);
                    const parsed = contract.interface.parseLog(ev);
                    if (!parsed)
                        continue;
                    const [orderId, seller, amount] = parsed.args;
                    const od = orders.get(Number(orderId));
                    if (!od)
                        continue;
                    const metadata = (0, metadataBuilder_1.buildPurchaseReceipt)(Number(orderId), od.listingId, od.buyer, String(seller), od.price, od.quantity, ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_1.mintAndTransfer)(metadata, od.buyer, ev.transactionHash);
                }
                last = latest;
            }
            catch { }
        }, 15000);
    })();
}