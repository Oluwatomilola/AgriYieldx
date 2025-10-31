import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListCard from "../components/ListCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

const demoListings = [
  {
    id: 101,
    name: "Fresh Maize (50kg)",
    image: "https://images.unsplash.com/photo-1596040033229-c7fbc4b8103c?q=80&w=1200&auto=format&fit=crop",
    price: 120,
    seller: "Sunrise Maize Farm"
  },
  {
    id: 102,
    name: "Premium Rice (25kg)",
    image: "https://images.unsplash.com/photo-1625246333195-78c63dc67e78?q=80&w=1200&auto=format&fit=crop",
    price: 85,
    seller: "Green Valley"
  },
  {
    id: 103,
    name: "Arabica Coffee Beans (10kg)",
    image: "https://images.unsplash.com/photo-1507133750040-4a8f570215b9?q=80&w=1200&auto=format&fit=crop",
    price: 260,
    seller: "Highland Estate"
  }
];

export default function Marketplace() {
  const { address: userAccountId } = useAccount();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);

  useEffect(() => {
    async function loadListings() {
      try {
        const data = await contractService.getListings();
        setListings(Array.isArray(data) && data.length ? data : demoListings);
      } catch {
        setListings(demoListings);
      }
    }
    loadListings();
  }, []);

  const handleBuy = async (listing) => {
    try {
      if (!userAccountId) {
        alert("Please connect your wallet before purchasing.");
        return;
      }

      // Check KYC status first
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
      const kycResponse = await fetch(`${API_URL}/kyc/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evmAddress: userAccountId }),
      });

      const kycData = await kycResponse.json();
      if (!kycData.kycApproved) {
        alert("KYC Required: Please claim tokens from the faucet first to complete KYC verification. Visit the Faucet page to get started.");
        return;
      }

      // Call the contract via contractService
      const tx = await contractService.purchase(listing.id, 1, true);
      alert("Purchase successful!");
    } catch (err) {
      console.error(err);
      if (err.message?.includes("KYC")) {
        alert("KYC Required: Please claim tokens from the faucet first to complete KYC verification.");
      } else {
        alert("Purchase failed: " + (err.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Marketplace</h1>
        {!userAccountId ? (
          <div className="text-center bg-white p-8 rounded-lg shadow-md">
            <p className="text-lg text-gray-700">Please connect your wallet to access the marketplace.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {listings.map((listing) => (
              <ListCard
                key={listing.id}
                listing={listing}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
