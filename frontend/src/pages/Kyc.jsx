
export default function Kyc() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-gray-900">KYC Verification</h1>
        <p className="text-sm text-center text-gray-600">
          To invest in farms, you need to complete KYC verification.
        </p>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="As it appears on your ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option>Passport</option>
              <option>Driver's License</option>
              <option>National ID</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Upload</label>
            <input
              type="file"
              className="w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Submit for Verification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
