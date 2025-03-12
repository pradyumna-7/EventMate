"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"

interface Participant {
  id: number
  name: string
  email: string
  phone: string
  utrId: string
  amount: number
  verified: boolean
}

const VerificationPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [phonepeFile, setPhonepeFile] = useState<File | null>(null)
  const [participantsFile, setParticipantsFile] = useState<File | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [verificationComplete, setVerificationComplete] = useState(false)

  const handlePhonepeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhonepeFile(e.target.files[0])
    }
  }

  const handleParticipantsFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setParticipantsFile(e.target.files[0])
    }
  }

  const handleVerification = async () => {
    if (!phonepeFile || !participantsFile) {
      toast.error("Please upload both PhonePe statement and participants list")
      return
    }

    setIsLoading(true)

    try {
      // In a real app, you would send these files to your backend
      // const formData = new FormData()
      // formData.append('phonepeFile', phonepeFile)
      // formData.append('participantsFile', participantsFile)
      // const response = await fetch('/api/verify', { method: 'POST', body: formData })
      // const data = await response.json()

      // Mock verification process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Mock data
      const mockParticipants: Participant[] = [
        {
          id: 1,
          name: "Rahul Sharma",
          email: "rahul@example.com",
          phone: "9876543210",
          utrId: "UTR123456789",
          amount: 500,
          verified: true,
        },
        {
          id: 2,
          name: "Priya Patel",
          email: "priya@example.com",
          phone: "9876543211",
          utrId: "UTR123456790",
          amount: 500,
          verified: true,
        },
        {
          id: 3,
          name: "Amit Kumar",
          email: "amit@example.com",
          phone: "9876543212",
          utrId: "UTR123456791",
          amount: 500,
          verified: false,
        },
        {
          id: 4,
          name: "Neha Singh",
          email: "neha@example.com",
          phone: "9876543213",
          utrId: "UTR123456792",
          amount: 750,
          verified: true,
        },
        {
          id: 5,
          name: "Vikram Malhotra",
          email: "vikram@example.com",
          phone: "9876543214",
          utrId: "UTR123456793",
          amount: 750,
          verified: false,
        },
      ]

      setParticipants(mockParticipants)
      setVerificationComplete(true)
      toast.success("Verification completed successfully!")
    } catch (error) {
      console.error("Verification error:", error)
      toast.error("Error during verification process")
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualVerify = (id: number) => {
    setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, verified: true } : p)))
    toast.success("Participant manually verified")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <p className="text-gray-500">Upload PhonePe statement and participants list to verify payments</p>
      </div>

      <Tabs defaultValue="upload">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="results" disabled={!verificationComplete}>
            Verification Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phonepe-file">PhonePe Statement (PDF)</Label>
                  <div className="mt-1 flex items-center">
                    <Input
                      id="phonepe-file"
                      type="file"
                      accept=".pdf"
                      onChange={handlePhonepeFileChange}
                      className="flex-1"
                    />
                  </div>
                  {phonepeFile && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {phonepeFile.name}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium text-blue-700">Instructions:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Upload your PhonePe transaction statement in PDF format</li>
                    <li>The system will extract UTR numbers, amounts, and timestamps</li>
                    <li>Only credit transactions will be considered for verification</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="participants-file">Participants List (CSV)</Label>
                  <div className="mt-1 flex items-center">
                    <Input
                      id="participants-file"
                      type="file"
                      accept=".csv"
                      onChange={handleParticipantsFileChange}
                      className="flex-1"
                    />
                  </div>
                  {participantsFile && (
                    <p className="text-sm text-gray-500 mt-1 flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      {participantsFile.name}
                    </p>
                  )}
                </div>

                <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
                  <p className="font-medium text-blue-700">CSV Format:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Name, Email, Phone Number, UTR ID, Expected Amount</li>
                    <li>Ensure the CSV has headers matching these fields</li>
                    <li>UTR ID should match exactly with the PhonePe statement</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleVerification}
                disabled={!phonepeFile || !participantsFile || isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Start Verification
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Verification Results</h3>
                <p className="text-sm text-gray-500">
                  {participants.filter((p) => p.verified).length} of {participants.length} participants verified
                </p>
              </div>
              <Button variant="outline" onClick={() => window.print()}>
                Export Results
              </Button>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>UTR ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{participant.phone}</TableCell>
                      <TableCell>{participant.utrId}</TableCell>
                      <TableCell>₹{participant.amount}</TableCell>
                      <TableCell>
                        {participant.verified ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Not Verified
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {!participant.verified && (
                          <Button variant="outline" size="sm" onClick={() => handleManualVerify(participant.id)}>
                            Verify Manually
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VerificationPage

