"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, Camera, UserCheck, QrCode } from "lucide-react"
import toast from "react-hot-toast"

interface ScanResult {
  id: number
  name: string
  email: string
  phone: string
  verified: boolean
  hash: string
  timestamp: string
}

const QRScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [attendanceMarked, setAttendanceMarked] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Mock function to simulate QR code scanning
  const mockScanQRCode = () => {
    // In a real app, this would be actual QR code scanning logic
    setTimeout(() => {
      const mockResult: ScanResult = {
        id: 1,
        name: "Rahul Sharma",
        email: "rahul@example.com",
        phone: "9876543210",
        verified: true,
        hash: "1-1678954321",
        timestamp: new Date().toISOString(),
      }

      setScanResult(mockResult)
      setScanning(false)
      toast.success("QR code scanned successfully!")
    }, 3000)
  }

  const startScanning = async () => {
    setScanning(true)
    setScanResult(null)
    setAttendanceMarked(false)
    setCameraError(null)

    try {
      // In a real app, you would initialize the camera and QR scanner here
      // const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      // if (videoRef.current) {
      //   videoRef.current.srcObject = stream
      //   videoRef.current.play()
      // }

      // For demo purposes, we'll use a mock function
      mockScanQRCode()
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError("Unable to access camera. Please check permissions.")
      setScanning(false)
    }
  }

  const stopScanning = useCallback(() => {
    setScanning(false)

    // In a real app, you would stop the camera stream here
    // if (videoRef.current && videoRef.current.srcObject) {
    //   const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
    //   tracks.forEach(track => track.stop())
    //   videoRef.current.srcObject = null
    // }
  }, [])

  const markAttendance = async () => {
    if (!scanResult) return

    try {
      // In a real app, you would call your backend API
      // const response = await fetch('/api/mark-attendance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ participantId: scanResult.id })
      // })

      // Mock attendance marking
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setAttendanceMarked(true)
      toast.success("Attendance marked successfully!")
    } catch (error) {
      console.error("Attendance marking error:", error)
      toast.error("Error marking attendance")
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning()
    }
  }, [stopScanning])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Scanner</h1>
        <p className="text-gray-500">Scan QR codes to verify participants and mark attendance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Scanner</h3>

          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden relative mb-4">
            {scanning ? (
              <>
                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full hidden"></canvas>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                </div>
                <div className="absolute bottom-4 left-0 right-0 text-center text-white text-sm font-medium bg-black/50 py-1">
                  Position QR code within the frame
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Camera className="h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">Camera preview will appear here</p>
                {cameraError && <p className="text-red-500 text-sm mt-2">{cameraError}</p>}
              </div>
            )}
          </div>

          <div className="flex justify-center">
            {scanning ? (
              <Button variant="destructive" onClick={stopScanning} className="w-full max-w-xs">
                Stop Scanning
              </Button>
            ) : (
              <Button onClick={startScanning} className="w-full max-w-xs">
                Start Scanning
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Scan Result</h3>

          {scanResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {scanResult.verified ? (
                  <div className="bg-green-100 text-green-800 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="bg-red-100 text-red-800 p-3 rounded-full">
                    <XCircle className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h4 className="text-xl font-bold">{scanResult.name}</h4>
                <p className="text-gray-500">{scanResult.phone}</p>
                <p className="text-gray-500">{scanResult.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Verification Status:</span>
                  <span className={scanResult.verified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {scanResult.verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Attendance Status:</span>
                  <span className={attendanceMarked ? "text-green-600 font-medium" : "text-gray-600 font-medium"}>
                    {attendanceMarked ? "Present" : "Not Marked"}
                  </span>
                </div>
              </div>

              <Button onClick={markAttendance} disabled={!scanResult.verified || attendanceMarked} className="w-full">
                <UserCheck className="mr-2 h-4 w-4" />
                {attendanceMarked ? "Attendance Marked" : "Mark Attendance"}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null)
                  setAttendanceMarked(false)
                }}
                className="w-full"
              >
                Scan Another
              </Button>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="bg-gray-100 p-3 rounded-full mb-3">
                <QrCode className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No QR code scanned yet</p>
              <p className="text-sm text-gray-400 mt-1">Scan a QR code to see participant details</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

export default QRScanner

