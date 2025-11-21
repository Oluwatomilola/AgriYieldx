import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white mt-12">
      <div className="mx-auto px-4 sm:px-6 md:px-8 lg:px-20 xl:px-28 py-8 sm:py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-6 md:space-y-0">
          <div className="text-center md:text-left">
            <div className="flex-shrink-0">
              <h1 className="text-xl sm:text-2xl font-semibold text-white">
                <Link to='/'>
                  🌱 AgriYield
                </Link>
              </h1>
            </div>
            <p className="mt-2 text-sm sm:text-md text-gray-400">Connecting investors, buyers and farmers.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-center md:text-left">
            <div>
              <h5 className="font-semibold mb-3">Quicklinks</h5>
              <ul className="space-y-2 text-sm">
                <li><Link to="/" className="block hover:text-green-400 transition-colors">Home</Link></li>
                <li><Link to="/farms" className="block hover:text-green-400 transition-colors">Farm Listings</Link></li>
                <li><Link to="/investor" className="block hover:text-green-400 transition-colors">Investor Dashboard</Link></li>
              </ul>
            </div>

            <div>
              <h5 className="font-semibold mb-3">Contact</h5>
              <ul className="space-y-2 text-sm">
                <li className="break-all">support@agriyield.local</li>
                <li>+123 456 7890</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 border-t border-gray-700 pt-4 sm:pt-6 text-center md:text-left">
          <p className="text-xs sm:text-sm">© {new Date().getFullYear()} AgriYield. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
