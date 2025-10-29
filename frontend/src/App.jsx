import { Routes, Route } from "react-router-dom";
import FarmerDashboard from "./pages/FarmerDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Marketplace from "./pages/Marketplace";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import { AppProvider } from "./context/WalletContext";

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Navbar on all pages */}
        <Navbar />

        {/* Main content */}
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/farmer" element={<FarmerDashboard />} />
              <Route path="/investor" element={<InvestorDashboard />} />
              <Route path="/buyer" element={<BuyerDashboard />} />
              <Route path="/marketplace" element={<Marketplace />} />
            </Routes>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-gray-100 dark:bg-gray-800 text-center py-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} AgriYield DApp
          </p>
        </footer>
      </div>
    </AppProvider>
  );
}
