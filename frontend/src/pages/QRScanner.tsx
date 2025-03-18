"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle, XCircle, Camera, QrCode, RefreshCw, Search, UserCheck } from "lucide-react"
import toast from "react-hot-toast"
import jsQR from "jsqr"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useSearchParams } from "react-router-dom"

// Update QRData interface to include hash
interface QRData {
  id: string;
  hash: string;
}

// Full participant data from API
interface ParticipantData {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  verified: boolean;
  amount?: number;
  attended?: boolean;
  utrId?: string;
  attendedAt?: string;
}

const QRScanner = () => {
  const [searchParams] = useSearchParams();
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ParticipantData | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastScannedQR = useRef<string | null>(null) // Track last scanned QR to avoid duplicates
  const [attendedParticipants, setAttendedParticipants] = useState<ParticipantData[]>([]);
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [fetchingAttendees, setFetchingAttendees] = useState(false);
  
  const backendUrl = 'http://localhost:5000';

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

  // Fetch participant data from backend using the participant ID
  const fetchParticipantData = async (participantId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}/api/participants/${participantId}`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.data) {
        throw new Error('Invalid response from server');
      }
      
      return result.data as ParticipantData;
    } catch (error) {
      console.error('Error fetching participant data:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

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
        lastScannedQR.current = code.data; // Prevent duplicate scans
        
        try {
          // Parse the QR data to get the participant ID and hash
          const qrData = JSON.parse(code.data) as QRData;
          
          if (!qrData.id || !qrData.hash) {
            toast.error("Invalid QR code format");
            return;
          }
          
          // Fetch the participant data using the ID
          fetchParticipantData(qrData.id)
            .then(participantData => {
              setScanResult(participantData);
              toast.success("QR code scanned successfully!");
            })
            .catch(error => {
              toast.error("Invalid QR code or participant not found");
              console.error("Error fetching participant data:", error);
            });
            
        } catch (error) {
          console.error("QR code parsing error:", error);
          toast.error("Invalid QR code");
        }
      }
    }

    requestAnimationFrame(scanQRCode) // Keep scanning while live
  }, [scanning])

  // Fetch all attended participants
  const fetchAttendedParticipants = async () => {
    try {
      setFetchingAttendees(true);
      const response = await fetch(`${backendUrl}/api/participants/get-all-attendees`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setAttendedParticipants(result.data);
      } else {
        console.error("Invalid response format for attended participants:", result);
      }
    } catch (error) {
      console.error("Error fetching attended participants:", error);
      toast.error("Failed to load attended participants");
    } finally {
      setFetchingAttendees(false);
    }
  };

  // Mark participant attendance
  const markAttendance = async (participantId: string) => {
    try {
      setLoading(true);
      
      // Get the hash from the last scanned QR code
      if (!lastScannedQR.current) {
        toast.error("QR code data not available");
        return;
      }
      
      const qrData = JSON.parse(lastScannedQR.current) as QRData;
      
      const response = await fetch(`${backendUrl}/api/participants/mark-attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          participantId: participantId,
          hash: qrData.hash
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        toast.success("Attendance marked successfully!");
        // Update the participant status in the UI
        if (scanResult) {
          setScanResult({ ...scanResult, attended: true });
        }
        // Refresh the list of attended participants
        fetchAttendedParticipants();
      } else {
        toast.error(result.message || "Failed to mark attendance");
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      toast.error(error instanceof Error ? error.message : "Failed to mark attendance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendedParticipants();
  }, []);

  // Filter attended participants based on search
  const filteredAttendees = attendedParticipants.filter(attendee => {
    if (!attendeeSearchQuery) return true;
    const query = attendeeSearchQuery.toLowerCase();
    return (
      attendee.name.toLowerCase().includes(query) ||
      attendee.email.toLowerCase().includes(query) ||
      attendee.phoneNumber.toLowerCase().includes(query) ||
      (attendee.utrId && attendee.utrId.toLowerCase().includes(query))
    );
  });

  useEffect(() => {
    if (scanning) {
      requestAnimationFrame(scanQRCode)
    }
  }, [scanning, scanQRCode])

  useEffect(() => stopScanning, [stopScanning])

  useEffect(() => {
    if (searchParams.get('view') === 'attendance') {
      const attendanceSection = document.querySelector('#attendance-list');
      attendanceSection?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [searchParams]);

  return (
    <div className="space-y-6">
      {/* <h1 className="text-2xl font-bold">QR Scanner</h1> */}
      <p className="text-gray-500">Scan QR codes to verify participants and mark attendance</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Scanner</h3>

          <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden relative mb-4">
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
                <Camera className="h-12 w-12 text-gray-400 dark:text-gray-300 mb-2" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Camera preview will appear here</p>
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
              <Button onClick={startScanning} className="w-full max-w-xs cursor-pointer">
                Start Scanning
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Scan Result</h3>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 text-primary animate-spin mb-4" />
              <p>Loading participant data...</p>
            </div>
          ) : scanResult ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {scanResult.verified ? (
                  <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 p-3 rounded-full">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 p-3 rounded-full">
                    <XCircle className="h-8 w-8" />
                  </div>
                )}
              </div>

              <div className="text-center">
                <h4 className="text-xl font-bold">{scanResult.name}</h4>
                <p className="text-gray-500">{scanResult.email}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2 dark:bg-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-300">Verification Status:</span>
                  <span className={scanResult.verified ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {scanResult.verified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-300">Phone:</span>
                  <span className="font-medium">{scanResult.phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-300">Amount:</span>
                  <span className="font-medium">
                    {scanResult.amount !== undefined ? `₹${scanResult.amount}` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-300">Attendance:</span>
                  <span className={scanResult.attended ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {scanResult.attended ? "Present" : "Not Marked"}
                  </span>
                </div>
                {scanResult.utrId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-300">UTR ID:</span>
                    <span className="font-medium">{scanResult.utrId}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                <Button variant="outline" onClick={() => setScanResult(null)} className="cursor-pointer">
                  Scan Another
                </Button>
                
                <Button 
                  onClick={() => markAttendance(scanResult._id)}
                  disabled={scanResult.attended || loading}
                  className="flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : scanResult.attended ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Already Marked
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Mark Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-full mb-3">
                <QrCode className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400">No QR code scanned yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Scan a QR code to see participant details</p>
            </div>
          )}
        </Card>
      </div>

      {/* Attended Participants List */}
      <Card className="p-6" id="attendance-list">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium">Attended Participants</h3>
            <p className="text-sm text-gray-500">{attendedParticipants.length} participants checked in</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAttendedParticipants}
            disabled={fetchingAttendees}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${fetchingAttendees ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search attendees..."
              className="pl-10"
              value={attendeeSearchQuery}
              onChange={(e) => setAttendeeSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center font-semibold text-gray-600">Name</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Email</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Phone</TableHead>
                <TableHead className="text-center font-semibold text-gray-600">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fetchingAttendees ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      Loading attendees...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredAttendees.length > 0 ? (
                filteredAttendees.map((attendee) => (
                  <TableRow key={attendee._id}>
                    <TableCell className="font-medium">{attendee.name}</TableCell>
                    <TableCell>{attendee.email}</TableCell>
                    <TableCell>{attendee.phoneNumber}</TableCell>
                    <TableCell>
                      {attendee.attendedAt 
                        ? new Date(attendee.attendedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    {attendeeSearchQuery 
                      ? 'No matching attendees found' 
                      : 'No participants have checked in yet'
                    }
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}

export default QRScanner
