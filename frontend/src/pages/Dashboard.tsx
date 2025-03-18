"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { FileCheck, QrCode, Scan, Users } from "lucide-react"
import { Card } from "@/components/ui/card"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    verifiedParticipants: 0,
    pendingVerification: 0,
    attendedParticipants: 0,
  })

  useEffect(() => {
    // In a real app, fetch stats from the backend
    const fetchStats = async () => {
      try {
        // Mock data for demonstration
        setStats({
          totalParticipants: 120,
          verifiedParticipants: 85,
          pendingVerification: 35,
          attendedParticipants: 42,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500">Overview of UPI payment verification and attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-white shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Participants</p>
              <p className="text-2xl font-bold">{stats.totalParticipants}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Verified Payments</p>
              <p className="text-2xl font-bold">{stats.verifiedParticipants}</p>
            </div>
            <FileCheck className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Verification</p>
              <p className="text-2xl font-bold">{stats.pendingVerification}</p>
            </div>
            <QrCode className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4 bg-white shadow rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Attended</p>
              <p className="text-2xl font-bold">{stats.attendedParticipants}</p>
            </div>
            <Scan className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link to="/verify" className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-colors">
              <FileCheck className="h-5 w-5 text-blue-500 dark:text-blue-400 mr-2" />
              <span className="text-blue-700 dark:text-blue-300">Verify Payments</span>
            </Link>
            <Link to="/generate-qr" className="flex items-center p-3 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-800/40 transition-colors">
              <QrCode className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
              <span className="text-green-700 dark:text-green-300">Generate QR Codes</span>
            </Link>
            <Link to="/scanner" className="flex items-center p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-800/40 transition-colors">
              <Scan className="h-5 w-5 text-purple-500 dark:text-purple-400 mr-2" />
              <span className="text-purple-700 dark:text-purple-300">Scan QR Codes</span>
            </Link>
            <Link to="/verify?tab=results" className="flex items-center p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-800/40 transition-colors">
              <Users className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mr-2" />
              <span className="text-yellow-700 dark:text-yellow-300">View All Participants</span>
            </Link>
            <Link to="/scanner?view=attendance" className="flex items-center p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors">
              <Users className="h-5 w-5 text-indigo-500 dark:text-indigo-400 mr-2" />
              <span className="text-indigo-700 dark:text-indigo-300">View Attendance</span>
            </Link>
            <Link to="/unattended" className="flex items-center p-3 bg-red-50 dark:bg-red-900/30 rounded-lg hover:bg-red-100 dark:hover:bg-red-800/40 transition-colors">
              <Users className="h-5 w-5 text-red-500 dark:text-red-400 mr-2" />
              <span className="text-red-700 dark:text-red-300">View Unattended</span>
            </Link>
          </div>
        </Card>

        <Card className="p-6 bg-white shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: "Payment verified", user: "Rahul Sharma", time: "10 minutes ago" },
              { action: "QR code generated", user: "Priya Patel", time: "25 minutes ago" },
              { action: "Attendance marked", user: "Amit Kumar", time: "1 hour ago" },
              { action: "Manual verification", user: "Neha Singh", time: "2 hours ago" },
            ].map((activity, index) => (
              <div key={index} className="flex items-start">
                <div className="h-2 w-2 mt-2 rounded-full bg-blue-500 mr-2"></div>
                <div>
                  <p className="text-sm font-medium">
                    {activity.action} - {activity.user}
                  </p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

