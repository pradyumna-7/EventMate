"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Download, Send, RefreshCw, Search, ChevronDown } from "lucide-react"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Participant {
  _id: string
  name: string
  email: string
  phoneNumber: string
  utrId?: string
  verified: boolean
  qrCode: string | null
}

type SortField = 'name' | 'email' | 'phoneNumber' | 'utrId';
type SortDirection = 'asc' | 'desc';

const QRGenerator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([])
  const [generatedQRs, setGeneratedQRs] = useState<{ id: string; qrCode: string }[]>([])
  const [fetchingParticipants, setFetchingParticipants] = useState(true)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [searchQuery, setSearchQuery] = useState('')

  const backendUrl = 'http://localhost:5000';

  useEffect(() => {
    const fetchVerifiedParticipants = async () => {
      setFetchingParticipants(true)
      try {
        const response = await fetch(`${backendUrl}/api/participants/verified`, {
          headers: {
            'Accept': 'application/json'
          }
        })
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Verified participants:', data);
        
        if (data.success && Array.isArray(data.data)) {
          setParticipants(data.data);
        } else {
          toast.error('Invalid response format from API');
          console.error('Invalid response format:', data);
        }
      } catch (error) {
        console.error('Failed to fetch verified participants:', error);
        toast.error(`Failed to load participants: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setFetchingParticipants(false);
      }
    };

    fetchVerifiedParticipants();
  }, [])

  const toggleSelectAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(participants.map((p) => p._id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedParticipants.includes(id)) {
      setSelectedParticipants(selectedParticipants.filter((pId) => pId !== id))
    } else {
      setSelectedParticipants([...selectedParticipants, id])
    }
  }

  const generateQRCodes = async () => {
    if (selectedParticipants.length === 0) {
      toast.error("Please select at least one participant")
      return
    }

    setIsLoading(true)

    try {
      // In a real app, you would call your backend API
      // const response = await fetch('/api/generate-qr', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ participantIds: selectedParticipants })
      // })
      // const data = await response.json()

      // Mock QR generation process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Generate mock QR codes
      const newQRs = selectedParticipants.map((id) => {
        // In a real app, this would be the actual QR code data from your backend
        return {
          id,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
            JSON.stringify({
              id,
              name: participants.find((p) => p._id === id)?.name,
              verified: true,
              hash: `${id}-${Date.now()}`,
            }),
          )}`,
        }
      })

      setGeneratedQRs(newQRs)

      // Update participants to mark QR as generated
      setParticipants((prev) =>
        prev.map((p) => (selectedParticipants.includes(p._id) ? { ...p, qrCode: newQRs.find(qr => qr.id === p._id)?.qrCode || null } : p)),
      )

      toast.success(`QR codes generated for ${selectedParticipants.length} participants`)
    } catch (error) {
      console.error("QR generation error:", error)
      toast.error("Error generating QR codes")
    } finally {
      setIsLoading(false)
    }
  }

  const sendQRCodes = () => {
    toast.success("QR codes sent successfully!")
  }

  const downloadQRCodes = () => {
    toast.success("QR codes downloaded successfully!")
  }

  // Updated sorting function to match Verification Results tab
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if the same field is clicked again
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Set new sort field and default to ascending
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedParticipants = participants
    .filter(participant => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        participant.name.toLowerCase().includes(query) ||
        participant.email.toLowerCase().includes(query) ||
        participant.phoneNumber.toLowerCase().includes(query) ||
        (participant.utrId && participant.utrId.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      // Handle null or undefined values
      const aValue = a[sortField] ?? '';
      const bValue = b[sortField] ?? '';
      
      // Case-insensitive string comparison
      if (sortDirection === 'asc') {
        return String(aValue).localeCompare(String(bValue), undefined, { sensitivity: 'base' });
      } else {
        return String(bValue).localeCompare(String(aValue), undefined, { sensitivity: 'base' });
      }
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">QR Code Generator</h1>
        <p className="text-gray-500">Generate QR codes for verified participants</p>
      </div>

      <Tabs defaultValue="participants">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="participants">Select Participants</TabsTrigger>
          <TabsTrigger value="generated" disabled={generatedQRs.length === 0}>
            Generated QR Codes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="participants">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Verified Participants</h3>
                <p className="text-sm text-gray-500">Select participants to generate QR codes</p>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="select-all"
                  checked={participants.length > 0 && selectedParticipants.length === participants.length}
                  onCheckedChange={toggleSelectAll}
                  disabled={participants.length === 0 || fetchingParticipants}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
            </div>
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search participants..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    {[
                      { key: 'name', label: 'Name' },
                      { key: 'email', label: 'Email' },
                      { key: 'phoneNumber', label: 'Phone' },
                      { key: 'utrId', label: 'UTR ID' },
                    ].map((col) => (
                      <TableHead 
                        key={col.key}
                        className="cursor-pointer"
                        onClick={() => handleSort(col.key as SortField)}
                      >
                        <div className="flex items-center">
                          <span>{col.label}</span>
                          <ChevronDown 
                            className={cn(
                              "ml-1 h-4 w-4 transition-transform duration-200",
                              sortField === col.key 
                                ? "opacity-100 " + (sortDirection === "desc" ? "rotate-0" : "rotate-180")
                                : "opacity-0 group-hover:opacity-50"
                            )}
                          />
                        </div>
                      </TableHead>
                    ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fetchingParticipants ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        <div className="flex justify-center items-center">
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                          Loading participants...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredAndSortedParticipants.length > 0 ? (
                    filteredAndSortedParticipants.map((participant) => (
                      <TableRow key={participant._id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedParticipants.includes(participant._id)}
                            onCheckedChange={() => toggleSelect(participant._id)}
                          />
                        </TableCell>
                        <TableCell>{participant.name}</TableCell>
                        <TableCell>{participant.email}</TableCell>
                        <TableCell>{participant.phoneNumber}</TableCell>
                        <TableCell>{participant.utrId || 'N/A'}</TableCell>
                        <TableCell>
                          {participant.qrCode ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              QR Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Ready
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        {searchQuery ? 'No matching participants found' : 'No verified participants found'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={generateQRCodes}
                disabled={selectedParticipants.length === 0 || isLoading}
                className="flex items-center"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="mr-2 h-4 w-4" />
                    Generate QR Codes
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="generated">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Generated QR Codes</h3>
                <p className="text-sm text-gray-500">{generatedQRs.length} QR codes generated</p>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={downloadQRCodes} className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Download All
                </Button>
                <Button onClick={sendQRCodes} className="flex items-center">
                  <Send className="mr-2 h-4 w-4" />
                  Send to Participants
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {generatedQRs.map((qr) => {
                const participant = participants.find((p) => p._id === qr.id)
                return (
                  <div key={qr.id} className="bg-white p-4 rounded-lg shadow">
                    <div className="flex flex-col items-center">
                      <img
                        src={qr.qrCode || "/placeholder.svg"}
                        alt={`QR code for ${participant?.name}`}
                        className="w-full max-w-[200px] h-auto"
                      />
                      <div className="mt-3 text-center">
                        <h4 className="font-medium">{participant?.name}</h4>
                        <p className="text-sm text-gray-500">{participant?.phoneNumber}</p>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(qr.qrCode, "_blank")}>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default QRGenerator

