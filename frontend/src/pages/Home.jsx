import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FarmCard from "../components/FarmCard";
import InvestmentModal from "../components/InvestmentModal";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

export default function Home() {
  const { address: userAccountId } = useAccount();
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await contractService.getFarms();
        if (mounted) setFarms(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load farms:", err);
        if (mounted) {
          setError(err.message || "Failed to load farms");
          setFarms([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userAccountId]);

  const handleInvestClick = async (farm) => {
    try {
      if (!userAccountId) {
        alert("Please connect your wallet first.");
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

      // Show investment modal
      setSelectedFarm(farm);
      setShowModal(true);
    } catch (e) {
      console.error(e);
      alert("Error checking KYC status: " + (e.message || "Unknown error"));
    }
  };

  const handleInvest = async (farmId, amount) => {
    try {
      const result = await contractService.invest(farmId, amount);
      // Reload farms
      const updatedFarms = await contractService.getFarms();
      setFarms(updatedFarms);
      return result;
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section
        className="min-h-[70vh] sm:min-h-screen relative bg-cover bg-center text-white py-20 sm:py-32 md:py-40 px-4"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 px-2">
            Invest in the Future of Agriculture
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 px-4">
            Connect with farmers, fund their projects, and share in the harvest.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
            <Link to="/farms" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition duration-300 text-center">
              Explore Farms
            </Link>
            <Link to="/faucet" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 sm:px-8 rounded-lg transition duration-300 text-center">
              Get Test Tokens
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED FARMS */}
      <section className="py-10 sm:py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-6 sm:mb-8">
            Featured Farm Campaigns
          </h2>
          
          {loading ? (
            <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
              <p className="text-base sm:text-lg text-gray-700">Loading farms...</p>
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
          ) : farms.length === 0 ? (
            <div className="text-center bg-white p-6 sm:p-8 rounded-lg shadow-md">
              <p className="text-base sm:text-lg text-gray-700">No farms available at the moment.</p>
              <Link to="/farms" className="inline-block mt-4 text-green-600 hover:text-green-700 font-semibold">
                Create a Farm →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {farms.map((farm) => (
                <FarmCard
                  key={farm.id}
                  farm={farm}
                  onInvest={() => handleInvestClick(farm)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-10 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-800 mb-8 sm:mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 text-center">
            <div className="p-4 sm:p-6">
              <div className="text-4xl sm:text-5xl text-green-600 mb-3 sm:mb-4">🌱</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">1. Discover Farms</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Browse through a variety of verified farm projects seeking funding.
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-4xl sm:text-5xl text-green-600 mb-3 sm:mb-4">💰</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">2. Invest & Fund</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Fund the projects you believe in and receive farm shares as NFTs.
              </p>
            </div>
            <div className="p-4 sm:p-6">
              <div className="text-4xl sm:text-5xl text-green-600 mb-3 sm:mb-4">🌾</div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">3. Share the Harvest</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Receive a return on your investment after a successful harvest.
              </p>
            </div>
          </div>
        </div>
      </section>

      {showModal && selectedFarm && (
        <InvestmentModal
          farm={selectedFarm}
          onClose={() => {
            setShowModal(false);
            setSelectedFarm(null);
          }}
          onInvest={handleInvest}
        />
      )}
    </div>
  );
}
