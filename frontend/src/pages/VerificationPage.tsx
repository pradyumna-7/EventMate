"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw, DollarSign, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"
import { useLocation } from "react-router-dom"

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
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const tabParam = queryParams.get('tab')
  
  const [isLoading, setIsLoading] = useState(false)
  const [phonepeFile, setPhonepeFile] = useState<File | null>(null)
  const [participantsFile, setParticipantsFile] = useState<File | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [verificationComplete, setVerificationComplete] = useState(false)
  const [expectedAmount, setExpectedAmount] = useState<string>("")
  const [activeTab, setActiveTab] = useState(tabParam === 'results' ? "results" : "upload")
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  // Load participants when the component mounts or when navigating to results tab
  useEffect(() => {
    if (activeTab === "results") {
      fetchParticipants()
    }
  }, [activeTab])

  const fetchParticipants = async () => {
    setIsLoading(true)
    try {
      // Adjust the URL if your backend is running on a different port
      // You can also set this in an environment variable
      const backendUrl = 'http://localhost:5000';
      
      const response = await fetch(`${backendUrl}/api/verification/results`)
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json()
      
      if (data.success && data.participants) {
        setParticipants(data.participants)
        setVerificationComplete(true)
      } else {
        console.error("Failed to fetch verification results:", data)
        toast.error("Failed to load verification results")
      }
    } catch (error) {
      console.error("Error fetching participants:", error)
      toast.error("Failed to load verification results. Please check if the backend server is running.")
    } finally {
      setIsLoading(false)
    }
  }

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
      // Use the same backendUrl here
      const backendUrl = 'http://localhost:5000';
      
      const formData = new FormData()
      formData.append('phonepeFile', phonepeFile)
      formData.append('participantsFile', participantsFile)
      formData.append('expectedAmount', expectedAmount)
      
      // Call the backend API to process the files
      const response = await fetch(`${backendUrl}/api/verification/verify-payments`, {
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
      
      // Switch to the results tab
      setActiveTab("results")
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

  // Filter and sort participants for display
  const filteredParticipants = participants
    .filter(p => 
      searchTerm ? 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.utrId.toLowerCase().includes(searchTerm.toLowerCase())
      : true
    )
    .sort((a, b) => {
      if (!sortBy) return 0;
      
      let valueA, valueB;
      switch (sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'phone':
          valueA = a.phone.toLowerCase();
          valueB = b.phone.toLowerCase();
          break;
        case 'amount':
          valueA = a.amount;
          valueB = b.amount;
          break;
        case 'verified':
          valueA = a.verified ? 1 : 0;
          valueB = b.verified ? 1 : 0;
          break;
        default:
          return 0;
      }
      
      // For numerical values
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return sortOrder === 'asc' 
          ? valueA - valueB 
          : valueB - valueA;
      }
      
      // For string values
      return sortOrder === 'asc' 
        ? valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        : valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <p className="text-gray-500">Upload PhonePe statement and participants list to verify payments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Files</TabsTrigger>
          <TabsTrigger value="results">
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
              <div>
                <h3 className="text-lg font-medium">Verification Results</h3>
                <p className="text-sm text-gray-500">
                  {participants.filter((p) => p.verified).length} of {participants.length} participants verified
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search participants..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Sorting Controls */}
                <div className="flex gap-2">
                  <select 
                    className="px-3 py-2 border rounded-md text-sm bg-white"
                    value={sortBy || ''}
                    onChange={(e) => setSortBy(e.target.value || null)}
                  >
                    <option value="">Sort by...</option>
                    <option value="name">Name</option>
                    <option value="phone">Phone</option>
                    <option value="amount">Amount</option>
                    <option value="verified">Status</option>
                  </select>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center"
                  >
                    {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
                  </Button>
                </div>
                
                <Button variant="outline" onClick={() => window.print()}>
                  Export Results
                </Button>
                <Button variant="outline" onClick={fetchParticipants}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSortBy('name')
                          setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        Name {sortBy === 'name' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                      </TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSortBy('phone')
                          setSortOrder(sortBy === 'phone' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        Phone {sortBy === 'phone' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                      </TableHead>
                      <TableHead>UTR ID</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSortBy('amount')
                          setSortOrder(sortBy === 'amount' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        Amount {sortBy === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setSortBy('verified')
                          setSortOrder(sortBy === 'verified' && sortOrder === 'asc' ? 'desc' : 'asc')
                        }}
                      >
                        Status {sortBy === 'verified' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                      </TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map((participant) => (
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
                          {searchTerm ? "No matching participants found" : "No participants found"}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default VerificationPage

