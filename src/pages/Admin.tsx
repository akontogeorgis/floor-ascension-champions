import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, formatTime } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  Activity,
  TrendingUp,
  AlertCircle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PendingActivity {
  id: string;
  full_name: string;
  email: string;
  department: string;
  duration_seconds: number;
  source: string;
  activity_date: string;
  created_at: string;
  notes: string | null;
}

interface ActivityStats {
  total_activities: number;
  verified_activities: number;
  pending_activities: number;
  unique_users: number;
  strava_activities: number;
  garmin_activities: number;
  manual_activities: number;
  apple_activities: number;
  fastest_time: number;
  average_time: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingActivities, setPendingActivities] = useState<PendingActivity[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    if (!supabase) {
      toast.error("Database not configured");
      navigate("/");
      return;
    }

    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) {
      toast.error("Please connect to Strava first");
      navigate("/");
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile?.is_admin) {
        toast.error("Access Denied: Admin privileges required");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchPendingActivities();
      fetchStats();
    } catch (error) {
      console.error('Error checking admin access:', error);
      toast.error("Failed to verify admin access");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingActivities = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('pending_activities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingActivities(data || []);
    } catch (error) {
      console.error('Error fetching pending activities:', error);
      toast.error("Failed to load pending activities");
    }
  };

  const fetchStats = async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('activity_stats')
        .select('*')
        .single();

      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleVerify = async (activityId: string) => {
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('activities')
        .update({ verified: true })
        .eq('id', activityId);

      if (error) throw error;

      toast.success("Activity verified!");
      fetchPendingActivities();
      fetchStats();
      window.dispatchEvent(new Event('activities-updated'));
    } catch (error) {
      console.error('Error verifying activity:', error);
      toast.error("Failed to verify activity");
    }
  };

  const handleReject = async (activityId: string) => {
    setActivityToDelete(activityId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!supabase || !activityToDelete) return;

    try {
      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('id', activityToDelete);

      if (error) throw error;

      toast.success("Activity rejected and deleted");
      fetchPendingActivities();
      fetchStats();
      window.dispatchEvent(new Event('activities-updated'));
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error("Failed to delete activity");
    } finally {
      setDeleteDialogOpen(false);
      setActivityToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <div className="animate-pulse">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container py-12">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage activities and users</p>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_activities}</div>
              <p className="text-xs text-muted-foreground">
                {stats.verified_activities} verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertCircle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_activities}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unique_users}</div>
              <p className="text-xs text-muted-foreground">
                Athletes competing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fastest Time</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(stats.fastest_time)}</div>
              <p className="text-xs text-muted-foreground">
                Avg: {formatTime(Math.round(stats.average_time))}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Verification
            {pendingActivities.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingActivities.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sources">Activity Sources</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingActivities.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-muted-foreground">No pending activities! 🎉</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingActivities.map((activity) => (
                <Card key={activity.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{activity.full_name}</CardTitle>
                        <CardDescription>
                          {activity.email} • {activity.department}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">{activity.source}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="text-2xl font-mono font-bold text-primary">
                          {formatTime(activity.duration_seconds)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Activity Date</p>
                        <p className="font-semibold">
                          {new Date(activity.activity_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {activity.notes && (
                      <div className="mb-4 p-3 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground mb-1">Notes:</p>
                        <p className="text-sm">{activity.notes}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVerify(activity.id)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Verify & Approve
                      </Button>
                      <Button
                        onClick={() => handleReject(activity.id)}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject & Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity by Source</CardTitle>
                  <CardDescription>Breakdown of where activities come from</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Strava</span>
                    </div>
                    <span className="font-bold">{stats.strava_activities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Garmin</span>
                    </div>
                    <span className="font-bold">{stats.garmin_activities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Manual</span>
                    </div>
                    <span className="font-bold">{stats.manual_activities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                      <span>Apple Watch</span>
                    </div>
                    <span className="font-bold">{stats.apple_activities}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Verification Status</CardTitle>
                  <CardDescription>Activity approval metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>Verified</span>
                    </div>
                    <span className="font-bold">{stats.verified_activities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-warning" />
                      <span>Pending</span>
                    </div>
                    <span className="font-bold">{stats.pending_activities}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span>Total</span>
                    </div>
                    <span className="font-bold">{stats.total_activities}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">Approval Rate</div>
                    <div className="text-2xl font-bold">
                      {stats.total_activities > 0
                        ? Math.round((stats.verified_activities / stats.total_activities) * 100)
                        : 0}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this activity. This action cannot be undone.
              The user will not be notified automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Admin;
