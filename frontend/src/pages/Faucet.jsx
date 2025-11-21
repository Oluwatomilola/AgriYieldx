import { Link } from 'react-router-dom';
import FaucetButton from '../components/FaucetButton';

export default function Faucet() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            Test Token Faucet
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Get free hUSDT test tokens to explore the AgriYield platform.
            Use these tokens to invest in farms and support agricultural projects.
          </p>
        </div>

        {/* Main Faucet Card */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Faucet Widget */}
          <div className="md:col-span-2">
            <FaucetButton />
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2 sm:mb-3">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  to="/farms"
                  className="block text-green-600 hover:text-green-700 text-sm hover:underline"
                >
                  → Browse Farms
                </Link>
                <Link
                  to="/investor"
                  className="block text-green-600 hover:text-green-700 text-sm hover:underline"
                >
                  → Investor Dashboard
                </Link>
                <Link
                  to="/farmer"
                  className="block text-green-600 hover:text-green-700 text-sm hover:underline"
                >
                  → Farmer Dashboard
                </Link>
                <Link
                  to="/kyc"
                  className="block text-green-600 hover:text-green-700 text-sm hover:underline"
                >
                  → Complete KYC
                </Link>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-3 sm:p-4 shadow-sm">
              <h4 className="text-sm sm:text-base font-semibold mb-2">Need HBAR?</h4>
              <p className="text-sm text-green-50 mb-3">
                Get free HBAR for gas fees from the official Hedera faucet
              </p>
              <a
                href="https://portal.hedera.com/faucet"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-50 transition-colors"
              >
                Get HBAR →
              </a>
            </div>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Connect Wallet</h3>
              <p className="text-sm text-gray-600">
                Connect your MetaMask wallet to the Hedera Testnet
              </p>
            </div>

            <div className="text-center">
              <div className="bg-blue-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Claim Tokens</h3>
              <p className="text-sm text-gray-600">
                Click the claim button to receive 1,000 hUSDT tokens instantly
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Start Investing</h3>
              <p className="text-sm text-gray-600">
                Use your tokens to invest in farms or buy fresh produce
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">What is hUSDT?</h3>
              <p className="text-gray-600 text-sm">
                hUSDT (Hedera USD Tether) is a test stablecoin created using the Hedera Token Service (HTS).
                It's only for testnet use and has no real-world value.
              </p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">How often can I claim?</h3>
              <p className="text-gray-600 text-sm">
                You can claim 1,000 hUSDT tokens once every 24 hours. The cooldown timer resets after each claim.
              </p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Why do I need HBAR?</h3>
              <p className="text-gray-600 text-sm">
                HBAR is the native cryptocurrency of Hedera and is used to pay for transaction fees (gas).
                You'll need a small amount of HBAR in your wallet to claim tokens and make transactions.
              </p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">What can I do with test tokens?</h3>
              <p className="text-gray-600 text-sm">
                Use hUSDT to:
              </p>
              <ul className="list-disc list-inside text-gray-600 text-sm mt-2 ml-4">
                <li>Invest in farm crowdfunding campaigns</li>
                <li>Claim your share of farm proceeds</li>
                <li>Test the platform's features and functionality</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Network Configuration</h3>
              <p className="text-gray-600 text-sm mb-2">
                Make sure your MetaMask is connected to Hedera Testnet:
              </p>
              <div className="bg-gray-50 rounded p-2 sm:p-3 font-mono text-[10px] sm:text-xs text-gray-700 overflow-x-auto">
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">Network Name:</span>
                  <span>Hedera Testnet</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">RPC URL:</span>
                  <span>https://testnet.hashio.io/api</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="font-semibold">Chain ID:</span>
                  <span>296</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Currency:</span>
                  <span>HBAR</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Having trouble? Check out our{' '}
            <a href="https://docs.hedera.com" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">
              documentation
            </a>{' '}
            or reach out for support.
          </p>
        </div>
      </div>
    </div>
  );
}
