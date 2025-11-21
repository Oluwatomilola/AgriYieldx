import axios from "axios";

export async function uploadToIPFS(file) {
  try {
      if (!file) {
        throw new Error("No file selected");
      }

      const jwtSecret = import.meta.env.VITE_PINATA_JWT_SECRET;
      if (!jwtSecret) {
        throw new Error("Pinata JWT secret not configured. Please add VITE_PINATA_JWT_SECRET to your .env file");
      }

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            Authorization: `Bearer ${jwtSecret}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status !== 200) {
        throw new Error("Failed to upload file");
      }

      const data = response.data;
      // setHash(data.IpfsHash);
      return data.IpfsHash;
    } catch (err) {
      console.error('IPFS Upload Error:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
      }
      throw new Error(err.response?.data?.error || err.message || "Failed to upload to IPFS");
    }
}
