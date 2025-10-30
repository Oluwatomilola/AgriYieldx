export default function FarmCard({ farm, onInvest }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <img 
        src={farm.image} 
        alt={farm.name} 
        className="w-full h-48 object-cover" 
      />
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">{farm.name}</h2>
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Funding Goal:</span> {farm.fundingGoal} HBAR
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Amount Raised:</span> {farm.raised} HBAR
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${Math.min((farm.raised / farm.fundingGoal) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
        <button
          onClick={() => onInvest(farm)}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
        >
          Invest Now
        </button>
      </div>
    </div>
  );
}
