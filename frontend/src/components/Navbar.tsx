import { Link } from "react-router-dom"
import { QrCode, FileCheck, Home, Scan } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

const Navbar = () => {
  return (
    <nav className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-[0_2px_4px_0_rgb(0,0,0,0.05)] dark:shadow-[0_2px_4px_0_rgb(255,255,255,0.03)] sticky top-0 z-50">
      <div className="container mx-auto px-4 bg-transparent">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center text-xl font-bold text-gray-800 dark:text-white">
              <QrCode className="mr-2" />
              EventMate - UPI Verification System
            </Link>
          </div>
          <div className="flex space-x-4">
            <Link
              to="/"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Home className="w-4 h-4 mr-1" />
              Dashboard
            </Link>
            <Link
              to="/verify"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <FileCheck className="w-4 h-4 mr-1" />
              Verify Payments
            </Link>
            <Link
              to="/generate-qr"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <QrCode className="w-4 h-4 mr-1" />
              Generate QR
            </Link>
            <Link
              to="/scanner"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Scan className="w-4 h-4 mr-1" />
              QR Scanner
            </Link>
            <ModeToggle />
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

