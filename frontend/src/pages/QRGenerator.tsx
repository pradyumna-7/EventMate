"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Download, Send, RefreshCw } from "lucide-react"
import toast from "react-hot-toast"

interface Participant {
  id: number
  name: string
  email: string
  phone: string
  utrId: string
  verified: boolean
  qrGenerated: boolean
}

const QRGenerator = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([
    {
      id: 1,
      name: "Rahul Sharma",
      email: "rahul@example.com",
      phone: "9876543210",
      utrId: "UTR123456789",
      verified: true,
      qrGenerated: false,
    },
    {
      id: 2,
      name: "Priya Patel",
      email: "priya@example.com",
      phone: "9876543211",
      utrId: "UTR123456790",
      verified: true,
      qrGenerated: false,
    },
    {
      id: 3,
      name: "Neha Singh",
      email: "neha@example.com",
      phone: "9876543213",
      utrId: "UTR123456792",
      verified: true,
      qrGenerated: false,
    },
  ])
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  const [generatedQRs, setGeneratedQRs] = useState<{ id: number; qrCode: string }[]>([])

  const toggleSelectAll = () => {
    if (selectedParticipants.length === participants.length) {
      setSelectedParticipants([])
    } else {
      setSelectedParticipants(participants.map((p) => p.id))
    }
  }

  const toggleSelect = (id: number) => {
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
              name: participants.find((p) => p.id === id)?.name,
              verified: true,
              hash: `${id}-${Date.now()}`,
            }),
          )}`,
        }
      })

      setGeneratedQRs(newQRs)

      // Update participants to mark QR as generated
      setParticipants((prev) =>
        prev.map((p) => (selectedParticipants.includes(p.id) ? { ...p, qrGenerated: true } : p)),
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
                  checked={selectedParticipants.length === participants.length}
                  onCheckedChange={toggleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium">
                  Select All
                </label>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>UTR ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedParticipants.includes(participant.id)}
                          onCheckedChange={() => toggleSelect(participant.id)}
                        />
                      </TableCell>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell>{participant.email}</TableCell>
                      <TableCell>{participant.phone}</TableCell>
                      <TableCell>{participant.utrId}</TableCell>
                      <TableCell>
                        {participant.qrGenerated ? (
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
                  ))}
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
                const participant = participants.find((p) => p.id === qr.id)
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
                        <p className="text-sm text-gray-500">{participant?.phone}</p>
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

