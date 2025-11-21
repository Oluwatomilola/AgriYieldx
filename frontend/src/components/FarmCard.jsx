import { ethers } from 'ethers';

export default function FarmCard({ farm, onInvest }) {
  // Add safety checks for farm data
  if (!farm) {
    return null;
  }

  // Convert from smallest units (6 decimals) to display HUSDT
  const formatAmount = (amount) => {
    if (!amount || amount === '0') return '0';
    try {
      return parseFloat(ethers.formatUnits(amount, 6)).toLocaleString('en-US', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
    } catch {
      return '0';
    }
  };

  const farmName = farm.name || 'Unnamed Farm';
  const fundingGoal = formatAmount(farm.fundingGoal);
  const raised = formatAmount(farm.raised);
  let isActive = true;
  try {
    const fundingGoalNum = parseFloat(ethers.formatUnits(farm.fundingGoal || 0, 6));
    const raisedNum = parseFloat(ethers.formatUnits(farm.raised || 0, 6));
    isActive = fundingGoalNum > 0 ? raisedNum < fundingGoalNum : true;
    if (typeof farm.status === 'number' && farm.status !== 0) {
      isActive = false;
    }
  } catch {
    isActive = true;
  }
  
  // Calculate progress percentage using 6-decimal units
  let progressPercentage = 0;
  try {
    const fundingGoalNum = parseFloat(ethers.formatUnits(farm.fundingGoal || 0, 6));
    const raisedNum = parseFloat(ethers.formatUnits(farm.raised || 0, 6));
    progressPercentage = fundingGoalNum > 0 ? Math.min((raisedNum / fundingGoalNum) * 100, 100) : 0;
  } catch {
    progressPercentage = 0;
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden transform hover:scale-105 transition-transform duration-300">
      <div className="w-full h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center overflow-hidden">
        {farm.image ? (
          <img 
            src={farm.image} 
            alt={farmName} 
            className="w-full h-full object-cover" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-gray-500"><svg class="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><span class="text-sm">Farm Image</span></div>';
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
            <span className="text-sm font-medium">Farm Image</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-800">{farmName}</h2>
          <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'}`}>{isActive ? 'Active' : 'Inactive'}</span>
        </div>
        {farm.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {farm.description}
          </p>
        )}
        <div className="space-y-2 mb-4">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Funding Goal:</span> {fundingGoal} hUSDT
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Amount Raised:</span> {raised} hUSDT
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
        <button
          onClick={() => onInvest(farm)}
          className={`w-full ${isActive ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'} text-white font-bold py-2 px-4 rounded-lg transition-all duration-300`}
          disabled={!isActive}
        >
          {isActive ? 'Invest Now' : 'Closed'}
        </button>
      </div>
    </div>
  );
}
