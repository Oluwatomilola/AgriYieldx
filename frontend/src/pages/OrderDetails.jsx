import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ethers } from "ethers";
import { contractService } from "../services/contractService";
import { useAccount } from 'wagmi';
import ChatBox from "../components/Chatbox";

export default function OrderDetails() {
  const { orderId } = useParams();
  const { address: userAccountId } = useAccount();
  const [order, setOrder] = useState(null);
  const [shippingCid, setShippingCid] = useState("");
  const [proofCid, setProofCid] = useState("");
  const [disputeReason, setDisputeReason] = useState("");

  useEffect(() => {
    async function fetchOrder() {
      if (orderId) {
        const orderDetails = await contractService.getOrder(orderId);
        setOrder(orderDetails);
      }
    }
    fetchOrder();
  }, [orderId]);

  const handleShipOrder = async () => {
    await contractService.shipOrder(orderId, shippingCid);
  };

  const handleConfirmReceived = async () => {
    await contractService.confirmReceived(orderId, proofCid);
  };

  const handleReleaseFunds = async () => {
    await contractService.releaseFunds(orderId);
  };

  const handleOpenDispute = async () => {
    await contractService.openDispute(orderId, disputeReason);
  };

  if (!order) {
    return <div>Loading...</div>;
  }

  const isBuyer = userAccountId?.toLowerCase() === order.buyer.toLowerCase();
  const isSeller = userAccountId?.toLowerCase() === order.seller.toLowerCase();

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Order Details</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Order #{orderId}</h2>
            <p><strong>Status:</strong> {order.status.toString()}</p>
            <p><strong>Buyer:</strong> {order.buyer}</p>
            <p><strong>Seller:</strong> {order.seller}</p>
            <p><strong>Price:</strong> {ethers.utils.formatUnits(order.price, 6)} HUSDT</p>
            <p><strong>Quantity:</strong> {order.quantity.toString()}</p>

            {isSeller && order.status === 0 && (
              <div className="mt-4">
                <input type="text" placeholder="Shipping CID" onChange={(e) => setShippingCid(e.target.value)} className="border rounded px-2 py-1 w-full" />
                <button onClick={handleShipOrder} className="mt-2 bg-blue-600 text-white font-bold py-2 px-4 rounded">Ship Order</button>
              </div>
            )}

            {isBuyer && order.status === 1 && (
              <div className="mt-4">
                <input type="text" placeholder="Proof CID" onChange={(e) => setProofCid(e.target.value)} className="border rounded px-2 py-1 w-full" />
                <button onClick={handleConfirmReceived} className="mt-2 bg-blue-600 text-white font-bold py-2 px-4 rounded">Confirm Received</button>
              </div>
            )}

            {isBuyer && order.status === 2 && (
              <button onClick={handleReleaseFunds} className="mt-4 bg-green-600 text-white font-bold py-2 px-4 rounded">Release Funds</button>
            )}

            {isBuyer && (order.status === 1 || order.status === 2) && (
              <div className="mt-4">
                <input type="text" placeholder="Dispute Reason CID" onChange={(e) => setDisputeReason(e.target.value)} className="border rounded px-2 py-1 w-full" />
                <button onClick={handleOpenDispute} className="mt-2 bg-red-600 text-white font-bold py-2 px-4 rounded">Open Dispute</button>
              </div>
            )}
          </div>
          <div className="bg-white rounded-lg shadow-md p-8">
            <ChatBox topicId={order.listingId} />
          </div>
        </div>
      </div>
    </div>
  );
}
