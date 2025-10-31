import { Link } from "react-router-dom";
import WalletConnect from "./WalletConnect";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 md:px-8 lg:px-20 xl:px-28">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <Link to='/' className="text-2xl font-bold text-green-600">
                🌱 AgriYield
              </Link>
            </div>
            <div className="hidden md:flex items-baseline space-x-4">
              <Link
                to="/marketplace"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Marketplace
              </Link>
              <Link
                to="/farms"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Farm Listings
              </Link>
              <Link
                to="/faucet"
                className="px-3 py-2 rounded-md text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 transition-colors border border-green-200"
              >
                💧 Faucet
              </Link>
              <Link
                to="/investor"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Investor Dashboard
              </Link>
              <Link
                to="/farmer"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
              >
                Farmer Dashboard
              </Link>
            </div>
          </div>
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/login" 
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
            >
              Login
            </Link>
            <Link 
              to="/signup" 
              className="px-4 py-2 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors"
            >
              Sign Up
            </Link>
            <WalletConnect />
          </div>
        </div>
      </div>
    </nav>
  );
}
