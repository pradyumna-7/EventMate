"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw, DollarSign } from "lucide-react"
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
  const [expectedAmount, setExpectedAmount] = useState<string>("")

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

    if (!expectedAmount || isNaN(Number(expectedAmount)) || Number(expectedAmount) <= 0) {
      toast.error("Please enter a valid expected payment amount")
      return
    }

    setIsLoading(true)

    try {
      // In a real app, send these files to your backend
      const formData = new FormData()
      formData.append('phonepeFile', phonepeFile)
      formData.append('participantsFile', participantsFile)
      formData.append('expectedAmount', expectedAmount)
      
      // Call the backend API to process the files
      const response = await fetch('http://localhost:5000/api/verify-payments', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Verification failed')
      }
      
      const data = await response.json()
      
      // After receiving the data, log it to help with debugging
      console.log('Verification API response:', data);
      console.log('First participant:', data.participants[0]);
      
      setParticipants(data.participants)
      setVerificationComplete(true)
      toast.success(`Verification completed successfully! ${data.verifiedCount} of ${data.totalCount} payments verified.`)
    } catch (error) {
      console.error("Verification error:", error)
      toast.error(`Error during verification process: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
            <div className="grid grid-cols-1 gap-6">
              {/* Payment amount input separated from upload areas */}
              <div className="space-y-4">
                <Label htmlFor="expected-amount">Expected Payment Amount (₹)</Label>
                <div className="flex max-w-md">
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                    <DollarSign className="h-4 w-4" />
                  </span>
                  <Input
                    id="expected-amount"
                    type="number"
                    placeholder="Enter the expected payment amount"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className="rounded-l-none"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the expected amount that each participant should have paid
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <Label>PhonePe Statement (PDF)</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-all">
                    {!phonepeFile ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Click or drag file to upload PhonePe statement</p>
                        <p className="text-xs text-gray-500">PDF format only</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-green-600" />
                        <p className="mt-2 text-sm font-medium text-gray-900">{phonepeFile.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(phonepeFile.size / 1024)} KB</p>
                      </div>
                    )}
                    
                    <input
                      id="phonepe-file"
                      type="file"
                      accept=".pdf"
                      onChange={handlePhonepeFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      className="mt-4"
                      onClick={() => document.getElementById('phonepe-file')?.click()}
                    >
                      {phonepeFile ? 'Change File' : 'Select File'}
                    </Button>
                    
                    {phonepeFile && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        className="mt-2 text-red-500 hover:text-red-700"
                        onClick={() => setPhonepeFile(null)}
                      >
                        Remove
                      </Button>
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
                  <Label>Participants List (CSV)</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-all">
                    {!participantsFile ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600">Click or drag file to upload participants list</p>
                        <p className="text-xs text-gray-500">CSV format only</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-green-600" />
                        <p className="mt-2 text-sm font-medium text-gray-900">{participantsFile.name}</p>
                        <p className="text-xs text-gray-500">{Math.round(participantsFile.size / 1024)} KB</p>
                      </div>
                    )}
                    
                    <input
                      id="participants-file"
                      type="file"
                      accept=".csv"
                      onChange={handleParticipantsFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    <Button 
                      type="button"
                      variant="outline" 
                      className="mt-4"
                      onClick={() => document.getElementById('participants-file')?.click()}
                    >
                      {participantsFile ? 'Change File' : 'Select File'}
                    </Button>
                    
                    {participantsFile && (
                      <Button 
                        type="button"
                        variant="ghost" 
                        className="mt-2 text-red-500 hover:text-red-700"
                        onClick={() => setParticipantsFile(null)}
                      >
                        Remove
                      </Button>
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
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleVerification}
                disabled={!phonepeFile || !participantsFile || !expectedAmount || isLoading}
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
                  {participants.length > 0 ? (
                    participants.map((participant) => (
                      <TableRow key={participant.id}>
                        <TableCell>{participant.name || '—'}</TableCell>
                        <TableCell>{participant.email || '—'}</TableCell>
                        <TableCell>{participant.phone || '—'}</TableCell>
                        <TableCell>{participant.utrId || '—'}</TableCell>
                        <TableCell>₹{participant.amount || '0'}</TableCell>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No participants found
                      </TableCell>
                    </TableRow>
                  )}
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

