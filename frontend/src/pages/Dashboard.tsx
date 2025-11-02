import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Car, Users, UserCheck, Clock } from "lucide-react";
import { format } from "date-fns";

interface Detection {
  id: string;
  plate_number: string;
  detection_time: string;
  vehicle_type: string;
  owner_name: string;
  verification_status: string;
}

interface Stats {
  totalDetections: number;
  totalResidents: number;
  totalVisitors: number;
  todayDetections: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalDetections: 0,
    totalResidents: 0,
    totalVisitors: 0,
    todayDetections: 0
  });
  const [recentDetections, setRecentDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('dashboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detections'
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    // Fetch total detections
    const { count: detectionsCount } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true });

    // Fetch total residents
    const { count: residentsCount } = await supabase
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
      .eq('is_resident', true);

    // Fetch visitor detections
    const { count: visitorsCount } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .eq('verification_status', 'Visitor');

    // Fetch today's detections
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todayCount } = await supabase
      .from('detections')
      .select('*', { count: 'exact', head: true })
      .gte('detection_time', today.toISOString());

    // Fetch recent detections
    const { data: detections } = await supabase
      .from('detections')
      .select('*')
      .order('detection_time', { ascending: false })
      .limit(10);

    setStats({
      totalDetections: detectionsCount || 0,
      totalResidents: residentsCount || 0,
      totalVisitors: visitorsCount || 0,
      todayDetections: todayCount || 0
    });

    setRecentDetections(detections || []);
    setLoading(false);
  };

  const statCards = [
    {
      title: "Total Detections",
      value: stats.totalDetections,
      icon: Car,
      description: "All time vehicle detections"
    },
    {
      title: "Registered Residents",
      value: stats.totalResidents,
      icon: Users,
      description: "Total resident vehicles"
    },
    {
      title: "Visitor Detections",
      value: stats.totalVisitors,
      icon: UserCheck,
      description: "Non-resident vehicles"
    },
    {
      title: "Today's Detections",
      value: stats.todayDetections,
      icon: Clock,
      description: "Detections in last 24 hours"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Detections Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Detections</CardTitle>
          <CardDescription>Latest vehicle detections from the system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plate Number</TableHead>
                <TableHead>Detection Time</TableHead>
                <TableHead>Vehicle Type</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentDetections.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No detections yet
                  </TableCell>
                </TableRow>
              ) : (
                recentDetections.map((detection) => (
                  <TableRow key={detection.id}>
                    <TableCell className="font-mono">{detection.plate_number}</TableCell>
                    <TableCell>
                      {format(new Date(detection.detection_time), 'PPp')}
                    </TableCell>
                    <TableCell>{detection.vehicle_type || 'N/A'}</TableCell>
                    <TableCell>{detection.owner_name || 'Unknown'}</TableCell>
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

export default Dashboard;
