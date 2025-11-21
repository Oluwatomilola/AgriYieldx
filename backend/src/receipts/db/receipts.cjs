"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReceiptsByOwner = getReceiptsByOwner;
exports.getReceiptByTx = getReceiptByTx;
exports.upsertReceipt = upsertReceipt;
const fs_1 = require("fs");
const path_1 = require("path");
const storePath = (0, path_1.join)(process.cwd(), "src", "db", "receipts.json");
function ensureStore() {
    try {
        const dir = (0, path_1.dirname)(storePath);
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        if (!(0, fs_1.existsSync)(storePath))
            (0, fs_1.writeFileSync)(storePath, JSON.stringify({ receipts: [] }, null, 2));
    }
    catch { }
}
function readAll() {
    ensureStore();
    try {
        const raw = (0, fs_1.readFileSync)(storePath, "utf8");
        const j = JSON.parse(raw || "{}");
        const arr = j?.receipts || [];
        return Array.isArray(arr) ? arr : [];
    }
    catch { }
    return [];
}
function writeAll(arr) {
    ensureStore();
    try {
        const out = { receipts: arr };
        (0, fs_1.writeFileSync)(storePath, JSON.stringify(out, null, 2));
    }
    catch { }
}
function getReceiptsByOwner(owner) {
    const arr = readAll();
    return arr.filter((r) => String(r.owner || "") === String(owner));
}
function getReceiptByTx(hash) {
    const arr = readAll();
    return arr.find((r) => String(r.txHash || "") === String(hash));
}
function upsertReceipt(rec) {
    const arr = readAll();
    const idx = arr.findIndex((r) => String(r.txHash || "") === String(rec.txHash));
    if (idx >= 0)
        arr[idx] = rec;
    else
        arr.push(rec);
    writeAll(arr);
}