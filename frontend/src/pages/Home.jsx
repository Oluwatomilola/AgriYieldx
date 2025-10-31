import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FarmCard from "../components/FarmCard";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';

const demoFarms = [
  {
    id: 1,
    name: "Sunrise Maize Farm",
    image: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 10000,
    raised: 2500,
    metaCID: "demo-maize-1"
  },
  {
    id: 2,
    name: "Green Valley Rice",
    image: "https://images.unsplash.com/photo-1500937287812-8f7f8e7a8c44?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 20000,
    raised: 12000,
    metaCID: "demo-rice-2"
  },
  {
    id: 3,
    name: "Highland Coffee Estate",
    image: "https://images.unsplash.com/photo-1492496913980-501348b61469?q=80&w=1200&auto=format&fit=crop",
    fundingGoal: 50000,
    raised: 38000,
    metaCID: "demo-coffee-3"
  }
];

export default function Home() {
  const { address: userAccountId } = useAccount();
  const [farms, setFarms] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = userAccountId ? await contractService.getFarms() : [];
        if (mounted) setFarms(Array.isArray(data) && data.length ? data : demoFarms);
      } catch {
        if (mounted) setFarms(demoFarms);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userAccountId]);

  const handleInvest = async (farmId, amount) => {
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

      // Call the contract via contractService
      await contractService.invest(farmId, amount, true);
      alert("Investment successful!");
    } catch (e) {
      console.error(e);
      if (e.message?.includes("KYC")) {
        alert("KYC Required: Please claim tokens from the faucet first to complete KYC verification.");
      } else {
        alert("Investment failed: " + (e.message || "Unknown error"));
      }
    }
  };

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section
        className="min-h-screen relative bg-cover bg-center text-white py-40 px-4"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1400&q=80')`,
        }}
      >
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-4">
            Invest in the Future of Agriculture
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Connect with farmers, fund their projects, and share in the harvest.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/farms" className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
              Explore Farms
            </Link>
            <Link to="/marketplace" className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-lg transition duration-300">
              Visit Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED FARMS */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Featured Farm Campaigns
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {farms.map((farm) => (
              <FarmCard
                key={farm.id}
                farm={farm}
                onInvest={(f) => handleInvest(f.id, 1)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <div className="text-5xl text-green-600 mb-4">🌱</div>
              <h3 className="text-xl font-semibold mb-2">1. Discover Farms</h3>
              <p className="text-gray-600">
                Browse through a variety of verified farm projects seeking funding.
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl text-green-600 mb-4">💰</div>
              <h3 className="text-xl font-semibold mb-2">2. Invest & Fund</h3>
              <p className="text-gray-600">
                Fund the projects you believe in and receive farm shares as NFTs.
              </p>
            </div>
            <div className="p-6">
              <div className="text-5xl text-green-600 mb-4">🌾</div>
              <h3 className="text-xl font-semibold mb-2">3. Share the Harvest</h3>
              <p className="text-gray-600">
                Receive a return on your investment after a successful harvest.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
