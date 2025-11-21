"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startAgriYieldListener = startAgriYieldListener;
const ethers_1 = require("ethers");
const metadataBuilder_1 = require("../services/metadataBuilder.cjs");
const nftMinter_1 = require("../services/nftMinter.cjs");
const agriAbi = [
    "event Invested(uint256 indexed farmId, address indexed investor, uint256 amount, uint256 shares)",
    "event FundsDisbursed(uint256 indexed farmId, uint256 amount)",
    "event InvestorClaimed(uint256 indexed farmId, address indexed investor, uint256 payout)",
    "function getFarm(uint256) view returns (tuple(address farmer,uint256,uint256,uint256,uint256,uint256,uint8,string))"
];
function startAgriYieldListener(rpcUrl, agriAddress) {
    const provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers_1.ethers.Contract(agriAddress, agriAbi, provider);
    (async () => {
        try {
            const latest = await provider.getBlockNumber();
            const from = Math.max(latest - 2000, 0);
            const investedTopic = ethers_1.ethers.id("Invested(uint256,address,uint256,uint256)");
            const investedLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [investedTopic] });
            for (const ev of investedLogs) {
                const block = await provider.getBlock(ev.blockNumber);
                const parsed = contract.interface.parseLog(ev);
                if (!parsed)
                    continue;
                const [farmId, investor, amount, shares] = parsed.args;
                const metadata = (0, metadataBuilder_1.buildInvestmentReceipt)(Number(farmId), String(investor), String(amount.toString()), Number(shares), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                await (0, nftMinter_1.mintAndTransfer)(metadata, String(investor), ev.transactionHash);
            }
            const disbursedTopic = ethers_1.ethers.id("FundsDisbursed(uint256,uint256)");
            const disbursedLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [disbursedTopic] });
            for (const ev of disbursedLogs) {
                const block = await provider.getBlock(ev.blockNumber);
                const parsed = contract.interface.parseLog(ev);
                if (!parsed)
                    continue;
                const [farmId, amount] = parsed.args;
                const farm = await contract.getFarm(Number(farmId));
                const farmer = String(farm.farmer);
                const metadata = (0, metadataBuilder_1.buildDisbursementReceipt)(Number(farmId), farmer, String(amount.toString()), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                await (0, nftMinter_1.mintAndTransfer)(metadata, farmer, ev.transactionHash);
            }
            const claimedTopic = ethers_1.ethers.id("InvestorClaimed(uint256,address,uint256)");
            const claimedLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [claimedTopic] });
            for (const ev of claimedLogs) {
                const block = await provider.getBlock(ev.blockNumber);
                const parsed = contract.interface.parseLog(ev);
                if (!parsed)
                    continue;
                const [farmId, investor, payout] = parsed.args;
                const metadata = (0, metadataBuilder_1.buildClaimReceipt)(Number(farmId), String(investor), String(payout.toString()), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                await (0, nftMinter_1.mintAndTransfer)(metadata, String(investor), ev.transactionHash);
            }
        }
        catch { }
    })();
    (async () => {
        let last = await provider.getBlockNumber();
        const investedTopic = ethers_1.ethers.id("Invested(uint256,address,uint256,uint256)");
        const disbursedTopic = ethers_1.ethers.id("FundsDisbursed(uint256,uint256)");
        const claimedTopic = ethers_1.ethers.id("InvestorClaimed(uint256,address,uint256)");
        setInterval(async () => {
            try {
                const latest = await provider.getBlockNumber();
                const from = last + 1;
                if (from > latest)
                    return;
                const invLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [investedTopic] });
                for (const ev of invLogs) {
                    const block = await provider.getBlock(ev.blockNumber);
                    const parsed = contract.interface.parseLog(ev);
                    if (!parsed)
                        continue;
                    const [farmId, investor, amount, shares] = parsed.args;
                    const metadata = (0, metadataBuilder_1.buildInvestmentReceipt)(Number(farmId), String(investor), String(amount.toString()), Number(shares), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_1.mintAndTransfer)(metadata, String(investor), ev.transactionHash);
                }
                const disLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [disbursedTopic] });
                for (const ev of disLogs) {
                    const block = await provider.getBlock(ev.blockNumber);
                    const parsed = contract.interface.parseLog(ev);
                    if (!parsed)
                        continue;
                    const [farmId, amount] = parsed.args;
                    const farm = await contract.getFarm(Number(farmId));
                    const farmer = String(farm.farmer);
                    const metadata = (0, metadataBuilder_1.buildDisbursementReceipt)(Number(farmId), farmer, String(amount.toString()), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_1.mintAndTransfer)(metadata, farmer, ev.transactionHash);
                }
                const clmLogs = await provider.getLogs({ address: agriAddress, fromBlock: from, toBlock: latest, topics: [claimedTopic] });
                for (const ev of clmLogs) {
                    const block = await provider.getBlock(ev.blockNumber);
                    const parsed = contract.interface.parseLog(ev);
                    if (!parsed)
                        continue;
                    const [farmId, investor, payout] = parsed.args;
                    const metadata = (0, metadataBuilder_1.buildClaimReceipt)(Number(farmId), String(investor), String(payout.toString()), ev.transactionHash, Number(block?.timestamp || Math.floor(Date.now() / 1000)));
                    await (0, nftMinter_1.mintAndTransfer)(metadata, String(investor), ev.transactionHash);
                }
                last = latest;
            }
            catch { }
        }, 15000);
    })();
}