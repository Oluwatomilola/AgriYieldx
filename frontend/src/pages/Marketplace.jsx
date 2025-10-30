import { useEffect, useState } from "react";
import ListCard from "../components/ListCard";
import ChatBox from "../components/Chatbox";
import { contractService } from "../services/contractService";
import { hcsService } from "../services/hcsService";
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
  const [listings, setListings] = useState([]);
  const [showChat, setShowChat] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const topicId = import.meta.env.VITE_HCS_TOPIC_ID;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await contractService.getListings();
        if (mounted) setListings(Array.isArray(data) && data.length ? data : demoListings);
      } catch {
        if (mounted) setListings(demoListings);
      }
    };
    load();

    return () => {
      mounted = false;
    };
  }, [topicId]);

  const handleBuy = async (listing) => {
    try {
      if (userAccountId) {
        await contractService.purchase(listing.id, 1);
      } else {
        alert("Please connect your wallet before purchasing.");
        return;
      }
      setActiveOrder(listing);
      setShowChat(true);
    } catch (err) {
      console.error(err);
      alert("Purchase failed.");
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Marketplace</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {!userAccountId ? (
              <div className="text-center bg-white p-8 rounded-lg shadow-md">
                <p className="text-lg text-gray-700">Please connect your wallet to access the marketplace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
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
          <div className="lg:col-span-1">
            {showChat && (
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
                {activeOrder && (
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-gray-800">Order Chat</h2>
                    <p className="text-gray-600">Discuss your order for <span className="font-medium">{activeOrder.name}</span>.</p>
                  </div>
                )}
                <ChatBox topicId={topicId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
