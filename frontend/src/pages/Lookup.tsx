import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";

interface VehicleInfo {
  plate_number: string;
  vehicle_type: string;
  owner_name: string;
  flat_number: string | null;
  phone: string | null;
  is_resident: boolean;
}

interface DetectionInfo {
  plate_number: string;
  detection_time: string;
  verification_status: string;
  confidence_score: number | null;
}

const Lookup = () => {
  const [plateNumber, setPlateNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [detections, setDetections] = useState<DetectionInfo[]>([]);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber.trim()) {
      toast({
        title: "Error",
        description: "Please enter a plate number",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setVehicleInfo(null);
    setDetections([]);

    // Search in vehicles table
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate_number', plateNumber.toUpperCase())
      .single();

    if (vehicleData) {
      setVehicleInfo(vehicleData);
    }

    // Search in detections table
    const { data: detectionsData } = await supabase
      .from('detections')
      .select('plate_number, detection_time, verification_status, confidence_score')
      .eq('plate_number', plateNumber.toUpperCase())
      .order('detection_time', { ascending: false })
      .limit(5);

    if (detectionsData) {
      setDetections(detectionsData);
    }

    if (!vehicleData && (!detectionsData || detectionsData.length === 0)) {
      toast({
        title: "Not Found",
        description: "No records found for this plate number",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Manual Lookup</h2>

      <Card>
        <CardHeader>
          <CardTitle>Search Vehicle</CardTitle>
          <CardDescription>Enter a plate number to search the database</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plate">Plate Number</Label>
              <div className="flex gap-2">
                <Input
                  id="plate"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                  placeholder="ABC1234"
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {vehicleInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
            <CardDescription>Registered vehicle details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plate Number</p>
                <p className="font-mono font-semibold text-lg">{vehicleInfo.plate_number}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vehicle Type</p>
                <p className="font-semibold">{vehicleInfo.vehicle_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Owner Name</p>
                <p className="font-semibold">{vehicleInfo.owner_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Flat Number</p>
                <p className="font-semibold">{vehicleInfo.flat_number || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-semibold">{vehicleInfo.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    vehicleInfo.is_resident
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}
                >
                  {vehicleInfo.is_resident ? "Resident" : "Visitor"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {detections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Detections</CardTitle>
            <CardDescription>Last 5 detections for this vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detections.map((detection, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center border-b border-border pb-3 last:border-0"
                >
                  <div>
                    <p className="font-semibold">
                      {new Date(detection.detection_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Confidence: {detection.confidence_score ? `${(detection.confidence_score * 100).toFixed(0)}%` : "N/A"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      detection.verification_status === 'Resident'
                        ? 'bg-green-500/20 text-green-400'
                        : detection.verification_status === 'Visitor'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {detection.verification_status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Lookup;
