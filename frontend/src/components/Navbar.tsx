import { Link } from "react-router-dom"
import { QrCode, FileCheck, Home, Scan } from "lucide-react"

const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold text-primary">
              <QrCode className="mr-2" />
              EventMate - UPI Verification System
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <Link
              to="/verify"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <FileCheck className="w-4 h-4 mr-1" />
              Verify Payments
            </Link>
            <Link
              to="/generate-qr"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <QrCode className="w-4 h-4 mr-1" />
              Generate QR
            </Link>
            <Link
              to="/scanner"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <Scan className="w-4 h-4 mr-1" />
              QR Scanner
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

