import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Loader2, Trophy } from "lucide-react";

interface SessionInfo {
  session_token: string;
  user_id: string;
  user_name: string;
  start_floor: number;
  start_time: string;
}

export default function QRFinish() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [finishFloor, setFinishFloor] = useState("13");

  useEffect(() => {
    // Check localStorage for active session
    const activeSession = localStorage.getItem('qr_session');
    if (activeSession) {
      const session = JSON.parse(activeSession);
      setSessionInfo(session);
    }
  }, []);

  const handleFinish = async () => {
    if (!sessionInfo) {
      toast.error("No active session found!", {
        description: "Please scan a START QR code first."
      });
      return;
    }

    setLoading(true);

    try {
      // Get the session from database
      const { data: session, error: sessionError } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('user_id', sessionInfo.user_id)
        .eq('completed', false)
        .single();

      if (sessionError || !session) {
        toast.error("Session not found or already completed");
        localStorage.removeItem('qr_session');
        return;
      }

      // Calculate duration
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      // Validate duration (30 seconds to 10 minutes)
      if (durationSeconds < 30) {
        toast.error("Time too short!", {
          description: "Minimum time is 30 seconds. Please start a new session."
        });
        return;
      }

      if (durationSeconds > 600) {
        toast.error("Session expired!", {
          description: "Maximum time is 10 minutes. Please start a new session."
        });
        // Clean up expired session
        await supabase.from('qr_sessions').delete().eq('id', session.id);
        localStorage.removeItem('qr_session');
        return;
      }

      // Calculate floors climbed
      const targetFloor = parseInt(finishFloor);
      const floorsClimbed = targetFloor - session.start_floor;

      if (floorsClimbed <= 0) {
        toast.error("Invalid finish floor!", {
          description: "You must climb upwards!"
        });
        return;
      }

      // Create activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          user_id: session.user_id,
          duration_seconds: durationSeconds,
          floors_climbed: floorsClimbed,
          source: 'qr',
          verified: true, // QR scans are auto-verified
          created_at: endTime.toISOString(),
          activity_date: endTime.toISOString(),
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          notes: `QR Scan: Floor ${session.start_floor} → ${targetFloor}`
        });

      if (activityError) throw activityError;

      // Mark session as completed
      await supabase
        .from('qr_sessions')
        .update({ completed: true, updated_at: endTime.toISOString() })
        .eq('id', session.id);

      // Clear localStorage
      localStorage.removeItem('qr_session');

      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;

      toast.success("🎉 Climb Completed!", {
        description: `${sessionInfo.user_name}: ${minutes}:${seconds.toString().padStart(2, '0')} | ${floorsClimbed} floors`,
        duration: 7000
      });

      // Redirect to leaderboard
      setTimeout(() => {
        navigate('/?tab=leaderboard');
      }, 2000);

    } catch (error) {
      console.error('Error finishing session:', error);
      toast.error("Failed to finish session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-background dark:from-blue-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Finish Your Climb! 🏁</CardTitle>
          <CardDescription>
            Select your destination floor
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {sessionInfo ? (
            <>
              <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
                <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
                  Active Session Found! ✅
                </p>
                <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                  <p>👤 User: {sessionInfo.user_name}</p>
                  <p>🏢 Start Floor: {sessionInfo.start_floor}</p>
                  <p>⏱️ Started: {new Date(sessionInfo.start_time).toLocaleTimeString()}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="finish-floor">Destination Floor *</Label>
                <Select value={finishFloor} onValueChange={setFinishFloor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select finish floor" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 13 }, (_, i) => i + 1).map((floor) => (
                      <SelectItem key={floor} value={floor.toString()}>
                        Floor {floor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Floors to climb: {parseInt(finishFloor) - sessionInfo.start_floor}
                </p>
              </div>

              <Button
                onClick={handleFinish}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Finishing...
                  </>
                ) : (
                  <>
                    <Trophy className="w-4 h-4 mr-2" />
                    Complete Climb
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-950 p-4 border border-yellow-200 dark:border-yellow-800">
              <p className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ No Active Session
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                You need to scan a START QR code first to begin tracking your climb.
              </p>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          )}

          <div className="rounded-lg bg-primary/5 p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground">ℹ️ How it works:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Your climb time is automatically calculated</li>
              <li>Valid times: 30 seconds to 10 minutes</li>
              <li>Activities are instantly verified</li>
              <li>Check the leaderboard to see your ranking!</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
