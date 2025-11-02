import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Search } from "lucide-react";

interface Detection {
  id: string;
  plate_number: string;
  image_url: string | null;
  confidence_score: number | null;
  detection_time: string;
  vehicle_type: string | null;
  owner_name: string | null;
  verification_status: string;
}

const Detections = () => {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [filteredDetections, setFilteredDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchDetections();

    const channel = supabase
      .channel('detections-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detections'
        },
        () => {
          fetchDetections();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    filterDetections();
  }, [searchTerm, statusFilter, detections]);

  const fetchDetections = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('detections')
      .select('*')
      .order('detection_time', { ascending: false });

    if (!error && data) {
      setDetections(data);
    }
    setLoading(false);
  };

  const filterDetections = () => {
    let filtered = [...detections];

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((d) => d.verification_status === statusFilter);
    }

    setFilteredDetections(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Vehicle Detections</h2>

      <Card>
        <CardHeader>
          <CardTitle>All Detections</CardTitle>
          <CardDescription>View and filter all detected vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by plate number or owner..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Resident">Resident</SelectItem>
                <SelectItem value="Visitor">Visitor</SelectItem>
                <SelectItem value="Unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Plate Number</TableHead>
                <TableHead>Detection Time</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDetections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No detections found
                  </TableCell>
                </TableRow>
              ) : (
                filteredDetections.map((detection) => (
                  <TableRow key={detection.id}>
                    <TableCell>
                      {detection.image_url ? (
                        <img
                          src={detection.image_url}
                          alt="Vehicle"
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-xs">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono font-semibold">
                      {detection.plate_number}
                    </TableCell>
                    <TableCell>
                      {format(new Date(detection.detection_time), 'PPp')}
                    </TableCell>
                    <TableCell>{detection.vehicle_type || 'N/A'}</TableCell>
                    <TableCell>{detection.owner_name || 'Unknown'}</TableCell>
                    <TableCell>
                      {detection.confidence_score
                        ? `${(detection.confidence_score * 100).toFixed(0)}%`
                        : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          detection.verification_status === 'Resident'
                            ? 'bg-green-500/20 text-green-400'
                            : detection.verification_status === 'Visitor'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {detection.verification_status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Detections;
