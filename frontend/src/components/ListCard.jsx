export default function ListCard({ listing, onBuy }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img 
        src={listing.image} 
        alt={listing.name} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{listing.name}</h3>
        <div className="mb-4">
          <p className="text-gray-600">
            <span className="font-semibold">Price:</span> 
            <span className="text-lg font-bold text-green-600 ml-1">
              {listing.price} hUSDT
            </span>
          </p>
          {listing.seller && (
            <p className="text-sm text-gray-500 mt-1">
              Seller: {listing.seller}
            </p>
          )}
        </div>
        <button
          onClick={() => onBuy(listing)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
