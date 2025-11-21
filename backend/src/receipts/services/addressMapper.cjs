"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMapping = getMapping;
exports.setMapping = setMapping;
const fs_1 = require("fs");
const path_1 = require("path");
const storePath = (0, path_1.join)(process.cwd(), "src", "db", "addressMap.json");
function ensureStore() {
    try {
        const dir = (0, path_1.dirname)(storePath);
        if (!(0, fs_1.existsSync)(dir))
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        if (!(0, fs_1.existsSync)(storePath))
            (0, fs_1.writeFileSync)(storePath, JSON.stringify({ mappings: {} }, null, 2));
    }
    catch { }
}
function getMapping(evm) {
    ensureStore();
    try {
        const raw = (0, fs_1.readFileSync)(storePath, "utf8");
        const j = JSON.parse(raw || "{}");
        const map = j?.mappings || {};
        return String(map[evm] || "");
    }
    catch { }
    return "";
}
function setMapping(evm, accountId) {
    ensureStore();
    try {
        const raw = (0, fs_1.readFileSync)(storePath, "utf8");
        const j = JSON.parse(raw || "{}");
        const map = j?.mappings || {};
        map[evm] = accountId;
        const out = { mappings: map };
        (0, fs_1.writeFileSync)(storePath, JSON.stringify(out, null, 2));
    }
    catch { }
}