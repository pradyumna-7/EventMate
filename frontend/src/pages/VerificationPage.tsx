"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Upload, FileText, AlertCircle, CheckCircle, RefreshCw, IndianRupee, Search, MinusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableRow, TableHeader } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"
import { useLocation } from "react-router-dom"
import axios from "axios"
import { AnimatePresence, motion } from "framer-motion";

interface Participant {
  id: number
  name: string
  email: string
  phone: string
  utrId: string
  amount: number
  verified: boolean
}

const backendUrl = 'http://localhost:5000';

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
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);


  // Load participants when the component mounts or when navigating to results tab
  useEffect(() => {
    if (activeTab === "results") {
      fetchParticipants()
    }
  }, [activeTab])

  const fetchParticipants = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get(`${backendUrl}/api/verification/results`)
      
      const data = response.data
      
      if (data.success && data.participants) {
        console.log(data.participants)
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
      const formData = new FormData()
      formData.append('phonepeFile', phonepeFile)
      formData.append('participantsFile', participantsFile)
      formData.append('expectedAmount', expectedAmount)
      
      // Call the backend API to process the files using axios
      const response = await axios.post(`${backendUrl}/api/verification/verify-payments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      
      const data = response.data
      
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

  const handleManualVerify = async (id: number, name: string) => {
    try {
      await axios.put(`${backendUrl}/api/verification/verify/${id}`);
      // Update local state on success
      setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, verified: true } : p)));
      
      // Show toast with participant name and undo button
      toast.success(
        (t) => (
          <div className="flex items-center justify-between">
            <span>{name} manually verified</span>
            <button
              className="ml-4 px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium hover:bg-gray-300"
              onClick={() => {
                handleUndoVerification(id, name);
                toast.dismiss(t.id);
              }}
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      );
    } catch (error) {
      console.error("Error verifying participant:", error);
      toast.error(`Failed to verify participant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  const handleUndoVerification = async (id: number, name: string) => {
    try {
      await axios.put(`${backendUrl}/api/verification/unverify/${id}`);
      // Update local state on success
      setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, verified: false } : p)));
      toast.success(`Verification of ${name} has been undone`);
    } catch (error) {
      console.error("Error undoing verification:", error);
      toast.error(`Failed to undo verification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

  const deleteParticipants = async () => {
    try {
      await axios.delete(`${backendUrl}/api/verification/delete`);
      setParticipants([]);
      toast.success("All participants deleted successfully");
    }
    catch (error) {
      console.error("Error deleting participants:", error);
      toast.error(`Failed to delete participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payment Verification</h1>
        <p className="text-gray-500">Upload PhonePe statement and participants list to verify payments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload" className="cursor-pointer">Upload Files</TabsTrigger>
          <TabsTrigger value="results" className="cursor-pointer">
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
                  <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md dark:bg-slate-400 dark:border-gray-600">
                    <IndianRupee className="h-6 w-6 "/>
                  </span>
                  <Input
                    id="expected-amount"
                    type="number"
                    placeholder="Enter the expected payment amount"
                    value={expectedAmount}
                    onChange={(e) => setExpectedAmount(e.target.value)}
                    className="rounded-l-none dark:border-gray-600"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Enter the expected amount that each participant should have paid
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="space-y-4">
                  <Label>PhonePe Statement (PDF)</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-all dark:bg-gray-700 dark:border-gray-600">
                    {!phonepeFile ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Click or drag file to upload PhonePe statement</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">PDF format only</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-green-600" />
                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{phonepeFile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(phonepeFile.size / 1024)} KB</p>
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
                      className="mt-4 dark:bg-gray-100 dark:text-gray-900" 
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

                  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md dark:bg-blue-900/20">
                    <p className="font-medium text-blue-700 dark:text-blue-500">Instructions:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 dark:text-slate-400">
                      <li>Upload your PhonePe transaction statement in PDF format</li>
                      <li>The system will extract UTR numbers, amounts, and timestamps</li>
                      <li>Only credit transactions will be considered for verification</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Participants List (CSV)</Label>
                  <div className="relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-all dark:bg-gray-700 dark:border-gray-600">
                    {!participantsFile ? (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Click or drag file to upload participants list</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">CSV format only</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileText className="mx-auto h-12 w-12 text-green-600" />
                        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{participantsFile.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{Math.round(participantsFile.size / 1024)} KB</p>
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
                      className="mt-4 dark:bg-gray-100 dark:text-gray-900"
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

                  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md dark:bg-blue-900/20">
                    <p className="font-medium text-blue-700 dark:text-blue-500">CSV Format:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1 dark:text-slate-400">
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
                className="flex items-center cursor-pointer"
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
                    className="px-3 py-2 border rounded-md text-sm bg-white cursor-pointer dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
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
                    className="flex items-center cursor-pointer"
                  >
                    {sortOrder === 'asc' ? 'Ascending ↑' : 'Descending ↓'}
                  </Button>
                </div>
                
                <Button
                  onClick={() => setIsWarningModalOpen(true)}
                  className="bg-gray-900 hover:bg-red-800 text-white shadow-lg transition-transform transform hover:scale-105 cursor-pointer dark:bg-gray-300 dark:hover:bg-red-700/80"
                >
                  <MinusCircle className="mr-2 h-4 w-4" />
                  Delete All
                </Button>
                <Button variant="outline" onClick={fetchParticipants} className="cursor-pointer">
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>
            <AnimatePresence>
        {isWarningModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
          >
            <div className="absolute inset-0 bg-black opacity-50"></div>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-slate-100 p-6 rounded-lg shadow-xl z-10 dark:bg-gray-900"
            >
                <h2 className="text-gray-800 text-2xl font-bold mb-4 dark:text-white">Attention</h2>
                <p className="text-gray-800 text-lg mb-4 dark:text-slate-200">
                This will remove all verified and un-verified participants. <br/> 
                Are you sure
                you want to proceed?
                </p>
              <div className="flex justify-end space-x-2">
                <Button onClick={() => setIsWarningModalOpen(false)} className="cursor-pointer">
                  Cancel
                </Button>
                <Button
                  onClick={() => deleteParticipants() }
                  className="bg-red-800 hover:bg-red-700/40 text-white cursor-pointer dark:bg-red-700/50 dark:hover:bg-red-700/70"
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center font-semibold text-gray-600">Name</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Email</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Phone</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">UTR ID</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Amount</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="text-center font-semibold text-gray-600">Action</TableHead>
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
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-700/55 dark:text-green-300">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-700/55 dark:text-red-300">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Not Verified
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!participant.verified && (
                              <div className="relative group">
                                <Button 
                                  variant="outline"  
                                  className="cursor-pointer dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-100/40" 
                                  size="sm" 
                                  onClick={() => handleManualVerify(participant.id, participant.name)}

                                >
                                  Verify Manually
                                </Button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg z-50">
                                  Click to verify the participant
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-gray-900 border-l-transparent border-r-transparent"></div>
                                </div>
                              </div>
                            )}
                            {participant.verified && (
                              <div className="relative group">
                                <Button 
                                  variant="ghost" 
                                  className="cursor-pointer text-gray-500 hover:text-red-600" 
                                  size="sm" 
                                  onClick={() => handleUndoVerification(participant.id, participant.name)}
                                >
                                  Undo Verification
                                </Button>
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none shadow-lg z-50">
                                  Click to undo verification
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-t-4 border-l-4 border-r-4 border-gray-900 border-l-transparent border-r-transparent"></div>
                                </div>
                              </div>
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

