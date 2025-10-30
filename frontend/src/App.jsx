import { Routes, Route } from "react-router-dom";
import FarmerDashboard from "./pages/FarmerDashboard";
import InvestorDashboard from "./pages/InvestorDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import Marketplace from "./pages/Marketplace";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AppProvider } from "./context/WalletContext";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import FarmListing from "./pages/FarmListing";
import Kyc from "./pages/Kyc";

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/farmer" element={<FarmerDashboard />} />
            <Route path="/investor" element={<InvestorDashboard />} />
            <Route path="/buyer" element={<BuyerDashboard />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/farms" element={<FarmListing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/kyc" element={<Kyc />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </AppProvider>
  );
}
