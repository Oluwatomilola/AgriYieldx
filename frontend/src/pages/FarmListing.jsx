
import { useEffect, useState } from "react";
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
];

export default function FarmListing() {
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
      if (userAccountId) {
        await contractService.invest(farmId, amount);
        alert("Investment successful!");
      } else {
        alert("Demo mode: connect wallet to invest when contracts are live.");
      }
    } catch (e) {
      console.error(e);
      alert("Investment failed.");
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Farm Listings</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => (
          <FarmCard
            key={farm.id}
            farm={farm}
            onInvest={(f) => handleInvest(f.id, 1)}
          />
        ))}
      </div>
    </div>
  );
}
