import express from "express";
// Upload route intentionally disabled to avoid requiring multer.
// If you need server-side uploads, install multer and re-enable.

const gateways = [
  (process.env.PINATA_GATEWAY || "https://gateway.pinata.cloud").replace(/\/$/, ""),
  "https://ipfs.io",
  "https://dweb.link"
];

async function fetchFromGateways(cid, path = "", accept = "application/json") {
  const clean = String(cid).replace(/^ipfs:\/\//, "").replace(/^ipfs:/, "").trim();
  const errors = [];

  for (const gw of gateways) {
    const url = `${gw}/ipfs/${clean}${path ? `/${path}` : ""}`;
    try {
      const resp = await fetch(url, {
        headers: { accept },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      if (resp.ok) {
        return resp;
      }
      errors.push(`${gw}: HTTP ${resp.status}`);
      // Skip rate-limits and 4xx/5xx; try next gateway
    } catch (err) {
      errors.push(`${gw}: ${err.message}`);
      // Try next gateway
    }
  }

  const errorMsg = `All IPFS gateways failed for CID ${clean}: ${errors.join(", ")}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

const router = express.Router();

// Upload route removed. Use frontend direct Pinata upload or re-enable with multer.

// Proxy metadata JSON via backend to avoid browser CORS and rate limits
router.get("/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const path = req.query.path || "";
    const resp = await fetchFromGateways(cid, path, "application/json");
    const contentType = resp.headers.get("content-type") || "application/json";

    // Check if the response is actually JSON or text
    if (contentType.includes("application/json") || contentType.includes("text/plain") || contentType.includes("text/")) {
      // Get the text first
      const text = await resp.text();

      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        res.set("content-type", "application/json");
        return res.json(data);
      } catch (jsonErr) {
        // If JSON parsing fails, return as plain text
        res.set("content-type", "text/plain");
        return res.send(text);
      }
    } else {
      // If it's not JSON/text (e.g., an image), return binary data
      console.warn(`IPFS CID ${cid} returned non-JSON content-type: ${contentType}. Returning as binary.`);
      const buf = Buffer.from(await resp.arrayBuffer());
      res.set("content-type", contentType);
      res.set("cache-control", "public, max-age=300");
      return res.status(200).send(buf);
    }
  } catch (err) {
    console.error("IPFS proxy JSON error:", err);
    return res.status(502).json({ error: "Failed to fetch IPFS metadata", message: err.message });
  }
});

// Proxy raw bytes (images, etc.)
router.get("/raw/:cid", async (req, res) => {
  try {
    const { cid } = req.params;
    const path = req.query.path || "";
    const resp = await fetchFromGateways(cid, path, "*/*");
    const contentType = resp.headers.get("content-type") || "application/octet-stream";
    const buf = Buffer.from(await resp.arrayBuffer());
    res.set("content-type", contentType);
    res.set("cache-control", "public, max-age=300");
    return res.status(200).send(buf);
  } catch (err) {
    console.error("IPFS proxy RAW error:", err);
    return res.status(502).json({ error: "Failed to fetch IPFS content", message: err.message });
  }
});

export default router;
