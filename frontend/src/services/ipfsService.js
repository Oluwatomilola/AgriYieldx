import axios from "axios";

export async function uploadToIPFS(file) {
  try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        "https://api.pinata.cloud/pinning/pinFileToIPFS",
        formData,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT_SECRET}`,
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
      console.log(err.message);
      return null;
    }
}
