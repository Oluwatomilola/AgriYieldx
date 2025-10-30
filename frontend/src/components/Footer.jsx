import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-20 xl:px-28 py-10">
        <div className="md:flex md:items-start md:justify-between">
          <div>
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-semibold text-white">
                <Link to='/'>
                  🌱 AgriYield
                </Link>
              </h1>
            </div>
            <p className="mt-2 text-md text-gray-400">Connecting investors, buyers and farmers.</p>
          </div>

          <div className="mt-6 md:mt-0 grid grid-cols-2 gap-6">
            <div>
              <h5 className="font-semibold">Quicklinks</h5>
              <ul className="mt-2 space-y-1 text-sm">
                <li><Link to="/" className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-green-400">Home</Link></li>
                <li><Link to="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-green-400">Marketplace</Link></li>
                <li><Link to="/farms" className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-green-400">Farm Listings</Link></li>
                <li><Link to="/investor" className="px-3 py-2 rounded-md text-sm font-medium transition-colors hover:text-green-400">Investor Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold">Contact</h5>
              <ul className="mt-2 space-y-1 text-sm">
                <li className="px-3 py-2 rounded-md text-sm font-medium transition-colors">support@agriyield.local</li>
                <li className="px-3 py-2 rounded-md text-sm font-medium transition-colors">+123 456 7890</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-6 flex flex-col md:flex-row items-center justify-between">
          <p className="px-3 py-2 rounded-md text-sm font-medium transition-colors">© {new Date().getFullYear()} AgriYield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
