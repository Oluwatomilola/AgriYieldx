import { Link } from "react-router-dom";
import WalletConnect from "./WalletConnect";

export default function Navbar() {
  return (
    <nav className="bg-green-400 shadow-md sticky top-0 z-50">
      <div className="max-w-[1920] mx-auto px-4 sm:px-6 md:px-8 lg:px-20 xl:px-28">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                <Link to='/'>
                  🌱 AgriYield
                </Link>
              </h1>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-baseline space-x-4 text-gray-700*">
              <Link 
                to="/marketplace" 
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Marketplace
              </Link>
              <Link 
                to="/farmer" 
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Farmer
              </Link>
              <Link 
                to="/investor" 
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Investor
              </Link>
              <Link 
                to="/buyer" 
                className="hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Buyer
              </Link>
            </div>
          </div>
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
}

// import { Link } from "react-router-dom";

// export default function Navbar() {
//   return (
//     <nav className="bg-green-600 text-white px-6 py-3 flex justify-between items-center">
//       <h1 className="text-xl font-bold">
//         <Link to="/">🌱 AgriYield</Link>
//       </h1>
//       <div className="space-x-4">
//         <Link to="/marketplace" className="hover:underline">
//           Marketplace
//         </Link>
//         <Link to="/farmer" className="hover:underline">
//           Farmer
//         </Link>
//         <Link to="/investor" className="hover:underline">
//           Investor
//         </Link>
//         <Link to="/buyer" className="hover:underline">
//           Buyer
//         </Link>
//       </div>
//     </nav>
//   );
// }
