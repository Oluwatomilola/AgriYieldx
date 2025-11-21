"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDisbursementReceipt = buildDisbursementReceipt;
exports.buildInvestmentReceipt = buildInvestmentReceipt;
exports.buildPurchaseReceipt = buildPurchaseReceipt;
exports.buildClaimReceipt = buildClaimReceipt;
exports.serializeMetadata = serializeMetadata;
function buildInvestmentReceipt(farmId, investor, amount, shares, txHash, timestamp) {
    return {
        type: "INVESTMENT",
        farmId,
        investor,
        amount,
        shares,
        txHash,
        timestamp
    };
}
function buildDisbursementReceipt(farmId, farmer, amount, txHash, timestamp) {
    return {
        type: "DISBURSEMENT",
        farmId,
        farmer,
        amount,
        txHash,
        timestamp
    };
}
function buildPurchaseReceipt(orderId, listingId, buyer, seller, pricePaid, quantity, txHash, timestamp) {
    return {
        type: "PURCHASE",
        orderId,
        listingId,
        buyer,
        seller,
        pricePaid,
        quantity,
        txHash,
        timestamp
    };
}

function buildClaimReceipt(farmId, investor, payout, txHash, timestamp) {
    return {
        type: "CLAIM",
        farmId,
        investor,
        payout,
        txHash,
        timestamp
    };
}

function serializeMetadata(meta) {
    try {
        const t = String(meta?.type || "");
        if (t === "INVESTMENT") {
            return [
                "I",
                String(meta.farmId || 0),
                String(meta.shares || 0)
            ].join("|");
        }
        if (t === "DISBURSEMENT") {
            return [
                "D",
                String(meta.farmId || 0)
            ].join("|");
        }
        if (t === "PURCHASE") {
            return [
                "P",
                String(meta.orderId || 0),
                String(meta.listingId || 0),
                String(meta.quantity || 0)
            ].join("|");
        }
        if (t === "CLAIM") {
            return [
                "C",
                String(meta.farmId || 0),
                String(meta.payout || 0)
            ].join("|");
        }
    } catch {}
    return JSON.stringify(meta || {});
}