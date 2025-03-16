import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from "react-hot-toast"
import Navbar from "./components/Navbar"
import Dashboard from "./pages/Dashboard"
import VerificationPage from "./pages/VerificationPage"
import QRScanner from "./pages/QRScanner"
import QRGenerator from "./pages/QRGenerator"
import "./App.css"

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen h-full w-full bg-gray-50">
        <Toaster position="top-center" />
        <Navbar />
        <div className="container mx-auto px-4 py-8 h-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/verify" element={<VerificationPage />} />
            <Route path="/generate-qr" element={<QRGenerator />} />
            <Route path="/scanner" element={<QRScanner />} />
                      </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App

