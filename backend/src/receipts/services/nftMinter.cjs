"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrCreateTokenId = getOrCreateTokenId;
exports.mintAndTransfer = mintAndTransfer;
exports.mintExistingReceipt = mintExistingReceipt;
exports.resolveSerialFromMirror = resolveSerialFromMirror;
exports.processPendingForEvm = processPendingForEvm;
const sdk_1 = require("@hashgraph/sdk");
const fs_1 = require("fs");
const path_1 = require("path");
const client_1 = require("../hedera/client.cjs");
const metadataBuilder_1 = require("./metadataBuilder.cjs");
const receipts_1 = require("../db/receipts.cjs");
const addressMapper_1 = require("./addressMapper.cjs");
const tokenStorePath = (0, path_1.join)(process.cwd(), "src", "db", "receiptToken.json");
function ensureTokenStore() {
    try {
        const dir = (0, path_1.dirname)(tokenStorePath);
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        if (!(0, fs_1.existsSync)(tokenStorePath))
            (0, fs_1.writeFileSync)(tokenStorePath, JSON.stringify({ tokenId: "" }, null, 2));
    }
    catch { }
}
async function getOrCreateTokenId() {
    const envId = String(process.env.RECEIPT_NFT_TOKEN_ID || "").trim();
    if (envId) return envId;
    ensureTokenStore();
    try {
        const raw = (0, fs_1.readFileSync)(tokenStorePath, "utf8");
        const j = JSON.parse(raw || "{}");
        const id = String(j?.tokenId || "");
        if (id)
            return id;
    }
    catch { }
    const client = (0, client_1.getClient)();
    const operatorId = sdk_1.AccountId.fromString((process.env.HEDERA_OPERATOR_ID || process.env.OPERATOR_ID));
    const operatorKey = sdk_1.PrivateKey.fromString((process.env.HEDERA_OPERATOR_KEY || process.env.OPERATOR_KEY));
    const tx = await new sdk_1.TokenCreateTransaction()
        .setTokenName("AgriYield Receipts")
        .setTokenSymbol("AYR")
        .setTokenType(sdk_1.TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setTreasuryAccountId(operatorId)
        .setSupplyType(sdk_1.TokenSupplyType.Infinite)
        .setAdminKey(operatorKey)
        .setSupplyKey(operatorKey)
        .freezeWith(client)
        .sign(operatorKey);
    const resp = await tx.execute(client);
    const receipt = await resp.getReceipt(client);
    const tokenId = String(receipt.tokenId?.toString() || "");
    try {
        (0, fs_1.writeFileSync)(tokenStorePath, JSON.stringify({ tokenId }, null, 2));
    }
    catch { }
    return tokenId;
}
async function mintAndTransfer(metadata, ownerEvmOrAccountId, txHash) {
    const ownerAccountId = String(ownerEvmOrAccountId || "").includes(".") ? String(ownerEvmOrAccountId) : (0, addressMapper_1.getMapping)(String(ownerEvmOrAccountId));
    const tokenId = await getOrCreateTokenId();
    const client = (0, client_1.getClient)();
    const operatorId = sdk_1.AccountId.fromString((process.env.HEDERA_OPERATOR_ID || process.env.OPERATOR_ID));
    const operatorKey = sdk_1.PrivateKey.fromString((process.env.HEDERA_OPERATOR_KEY || process.env.OPERATOR_KEY));
    const meta = Buffer.from((0, metadataBuilder_1.serializeMetadata)(metadata));
    const mintTx = await new sdk_1.TokenMintTransaction()
        .setTokenId(tokenId)
        .setMetadata([meta])
        .freezeWith(client)
        .sign(operatorKey);
    const mintResp = await mintTx.execute(client);
    const mintReceipt = await mintResp.getReceipt(client);
    const serial = Number(mintReceipt.serials?.[0] || 0);
    let transferTxId = "";
    const rec = {
        status: "MINTED",
        tokenId,
        serial,
        owner: String(ownerAccountId || ""),
        txHash,
        transferTxId,
        metadata
    };
    (0, receipts_1.upsertReceipt)(rec);
    return rec;
}
async function mintExistingReceipt(txHash) {
    const rec = (0, receipts_1.getReceiptByTx)(txHash);
    if (!rec)
        return null;
    if (rec.status === "MINTED" && rec.serial)
        return rec;
    const ownerAccountId = (0, addressMapper_1.getMapping)(String(rec?.metadata?.investor || rec?.metadata?.buyer || ""));
    if (!ownerAccountId)
        return null;
    return mintAndTransfer(rec.metadata, ownerAccountId, txHash);
}
async function resolveSerialFromMirror(txHash) {
    const rec = (0, receipts_1.getReceiptByTx)(txHash);
    if (!rec || !rec.tokenId)
        return null;
    const url = `https://testnet.mirrornode.hedera.com/api/v1/tokens/${rec.tokenId}/nfts?order=desc&limit=100`;
    const r = await fetch(url);
    if (!r.ok)
        return null;
    const j = await r.json();
    const nfts = j?.nfts || [];
    if (!Array.isArray(nfts) || !nfts.length)
        return null;
    for (const n of nfts) {
        const serial = Number(n.serial_number || 0);
        const turl = `https://testnet.mirrornode.hedera.com/api/v1/tokens/${rec.tokenId}/nfts/${serial}/transactions`;
        const tr = await fetch(turl);
        if (!tr.ok)
            continue;
        const tj = await tr.json();
        const txns = tj?.transactions || [];
        const found = txns.find((x) => String(x.transaction_id || "").startsWith(String(rec.transferTxId || "")));
        if (found) {
            rec.serial = serial;
            (0, receipts_1.upsertReceipt)(rec);
            return rec;
        }
    }
    return null;
}
async function processPendingForEvm(evm) {
    const arr = (0, receipts_1.getReceiptsByOwner)(String(evm));
    const id = (0, addressMapper_1.getMapping)(String(evm));
    if (!id)
        return;
    for (const rec of arr) {
        if (rec.status !== "MINTED") {
            await mintAndTransfer(rec.metadata, id, rec.txHash);
        }
    }
}