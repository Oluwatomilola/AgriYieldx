import axios from "axios";
import FormData from "form-data";

export async function uploadToIpfs(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: "file required" });
    const PINATA_JWT = process.env.PINATA_JWT;
    if (!PINATA_JWT) return res.status(500).json({ error: "Pinata JWT not configured" });

    const form = new FormData();
    form.append("file", Buffer.from(req.file.buffer), { filename: req.file.originalname });

    const resp = await axios.post("https://api.pinata.cloud/pinning/pinFileToIPFS", form, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...form.getHeaders(),
      },
      maxBodyLength: Infinity,
    });

    const cid = resp.data.IpfsHash;
    res.json({ uri: `ipfs://${cid}`, cid });
  } catch (err) {
    console.error(err?.response?.data ?? err);
    res.status(500).json({ error: err.message ?? String(err) });
  }
}
