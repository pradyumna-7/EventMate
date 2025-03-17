"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, Camera, QrCode } from "lucide-react"
import toast from "react-hot-toast"
import jsQR from "jsqr"

interface ScanResult {
  id: string
  name: string
  email: string
  phoneNumber: string  // Added phone number
  verified: boolean
  timestamp: number
  amount?: number      // Added amount field
  attended?: boolean   // Added attended field
}

const QRScanner = () => {
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastScannedQR = useRef<string | null>(null) // Track last scanned QR to avoid duplicates

  const startScanning = async () => {
    setScanning(true)
    setCameraError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError("Unable to access camera. Please check permissions.")
      setScanning(false)
    }
  }

  const stopScanning = useCallback(() => {
    setScanning(false)
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }, [])

  const scanQRCode = useCallback(() => {
    if (!scanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(scanQRCode)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)

      if (code && code.data !== lastScannedQR.current) {
        try {
          const result: ScanResult = JSON.parse(code.data)
          setScanResult(result)
          lastScannedQR.current = code.data // Prevent duplicate scans
          toast.success("QR code scanned successfully!")
        } catch (error) {
          console.error("QR code parsing error:", error)
          toast.error("Failed to parse QR code")
        }
      }
    }

    requestAnimationFrame(scanQRCode) // Keep scanning while live
  }, [scanning])

  useEffect(() => {
    if (scanning) {
      requestAnimationFrame(scanQRCode)
    }
  }, [scanning, scanQRCode])

  useEffect(() => stopScanning, [stopScanning])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QR Scanner</h1>
      <p className="text-gray-500">Scan QR codes to verify participants and mark attendance</p>

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
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium">{scanResult.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">
                    {scanResult.amount !== undefined ? `₹${scanResult.amount}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Attendance:</span>
                  <span className={scanResult.attended ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {scanResult.attended ? "Present" : "Not Marked"}
                  </span>
                </div>
              </div>

              <Button variant="outline" onClick={() => setScanResult(null)} className="w-full">
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
