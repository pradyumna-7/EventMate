import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const backendURL = 'http://localhost:5000'

interface Participant {
  _id: string
  name: string
  email: string
  phoneNumber: string
  verified: boolean
  attended: boolean
  verifiedAt?: Date
}

const UnattendedList = () => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchUnattendedParticipants = async (search?: string) => {
    try {
      const searchQuery = search ? `&search=${search}` : '';
      const response = await fetch(`${backendURL}/api/participants/unattended?${searchQuery}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      if (data.success) {
        setParticipants(data.data);
      } else {
        setError(data.message || 'Failed to fetch participants');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch participants');
      console.error('Error fetching unattended participants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnattendedParticipants();
  }, [])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    fetchUnattendedParticipants(e.target.value);
  };

  const filteredParticipants = participants.filter(participant => 
    participant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.phoneNumber.includes(searchTerm)
  );

  if (loading) return <div>Loading...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Unattended Participants</h1>
        <p className="text-gray-500">Verified participants who haven't attended yet</p>
      </div>

      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search by name, email or phone..."
          value={searchTerm}
          onChange={handleSearch}
          className="pl-8"
        />
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-center p-2 text-gray-600 font-semibold">Name</th>
                <th className="text-center p-2 text-gray-600 font-semibold">Email</th>
                <th className="text-center p-2 text-gray-600 font-semibold">Phone</th>
                <th className="text-center p-2 text-gray-600 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((participant) => (
                <tr key={participant._id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{participant.name}</td>
                  <td className="p-2">{participant.email}</td>
                  <td className="p-2">{participant.phoneNumber}</td>
                  <td className="p-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-700/60 dark:text-yellow-300 rounded-full text-sm">
                      Not Attended
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredParticipants.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              No unattended participants found
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default UnattendedList
