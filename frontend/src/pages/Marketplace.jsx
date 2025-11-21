import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ListCard from "../components/ListCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function Marketplace() {
  const { address: userAccountId } = useAccount();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        setError(null);
        const data = await contractService.getListings();
        setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load listings:", err);
        setError(err.message || "Failed to load marketplace listings");
        setListings([]);
      } finally {
        setLoading(false);
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
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">Marketplace</h1>
        {!userAccountId ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-gray-700">Please connect your wallet to access the marketplace.</p>
          </div>
        ) : loading ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-gray-700">Loading marketplace listings...</p>
          </div>
        ) : error ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
            <p className="text-base sm:text-lg text-gray-700">No active listings available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
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
