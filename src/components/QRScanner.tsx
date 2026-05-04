import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QrCode, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Html5Qrcode } from "html5-qrcode";

interface QRSession {
  id: string;
  user_id: string;
  start_floor: number;
  start_time: string;
  session_token: string;
  completed: boolean;
}

export default function QRScanner() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
  const [activeSession, setActiveSession] = useState<QRSession | null>(null);
  const [processing, setProcessing] = useState(false);

  // Check for active session on mount
  useEffect(() => {
    checkActiveSession();
  }, []);

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [scanner]);

  const checkActiveSession = async () => {
    try {
      const athleteId = localStorage.getItem('strava_athlete_id');
      if (!athleteId) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) return;

      const { data: session } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .order('start_time', { ascending: false })
        .limit(1)
        .single();

      if (session) {
        setActiveSession(session);
      }
    } catch (error) {
      // No active session
      setActiveSession(null);
    }
  };

  const startScanning = async () => {
    try {
      setScanning(true);
      const html5QrCode = new Html5Qrcode("qr-reader");
      setScanner(html5QrCode);

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        onScanSuccess,
        () => {} // onScanFailure - ignore errors
      );
    } catch (error) {
      console.error("Scanner error:", error);
      toast.error("Failed to start camera. Please allow camera access.");
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setScanning(false);
    setScanner(null);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processing) return; // Prevent duplicate scans
    
    setProcessing(true);
    await stopScanning();
    
    try {
      await handleQRCode(decodedText);
    } finally {
      setProcessing(false);
    }
  };

  const handleQRCode = async (qrToken: string) => {
    try {
      // Get user profile
      const athleteId = localStorage.getItem('strava_athlete_id');
      if (!athleteId) {
        toast.error("Please connect to Strava first to create your profile");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) {
        toast.error("Profile not found. Please reconnect to Strava.");
        return;
      }

      // Verify QR code exists
      const { data: qrCode } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('qr_token', qrToken)
        .eq('is_active', true)
        .single();

      if (!qrCode) {
        toast.error("Invalid QR code");
        return;
      }

      // Handle START QR code
      if (qrCode.qr_type === 'start') {
        // Check if user already has an active session
        const { data: existingSession } = await supabase
          .from('qr_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', false)
          .single();

        if (existingSession) {
          toast.error("You already have an active climbing session. Please finish it first.");
          return;
        }

        // Create new session
        const sessionToken = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase
          .from('qr_sessions')
          .insert({
            user_id: profile.id,
            start_floor: qrCode.floor_number,
            session_token: sessionToken,
            completed: false
          });

        if (error) throw error;

        await checkActiveSession(); // Refresh active session
        toast.success(`Session started from floor ${qrCode.floor_number}!`, {
          description: "Now climb to your target floor and scan the QR code there."
        });
        setOpen(false);
      }
      // Handle FINISH QR code
      else if (qrCode.qr_type === 'finish') {
        // Get active session
        const { data: session } = await supabase
          .from('qr_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .eq('completed', false)
          .single();

        if (!session) {
          toast.error("No active climbing session. Please scan a START QR code first.");
          return;
        }

        // Calculate duration
        const startTime = new Date(session.start_time);
        const endTime = new Date();
        const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        // Validate duration (30 seconds to 10 minutes)
        if (durationSeconds < 30) {
          toast.error("Time too short. Minimum is 30 seconds.");
          return;
        }

        if (durationSeconds > 600) {
          toast.error("Session expired (max 10 minutes). Please start a new session.");
          // Clean up expired session
          await supabase
            .from('qr_sessions')
            .delete()
            .eq('id', session.id);
          setActiveSession(null);
          return;
        }

        // Calculate floors climbed
        const floorsClimbed = qrCode.floor_number - session.start_floor;
        
        if (floorsClimbed <= 0) {
          toast.error("Invalid finish floor. You must climb upwards!");
          return;
        }

        // Create activity
        const { error: activityError } = await supabase
          .from('activities')
          .insert({
            user_id: profile.id,
            duration_seconds: durationSeconds,
            floors_climbed: floorsClimbed,
            source: 'qr',
            verified: true, // QR scans are auto-verified
            created_at: endTime.toISOString(),
            activity_date: endTime.toISOString(),
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            notes: `QR Session: Floor ${session.start_floor} to ${qrCode.floor_number}`
          });

        if (activityError) throw activityError;

        // Mark session as completed
        await supabase
          .from('qr_sessions')
          .update({ completed: true, updated_at: new Date().toISOString() })
          .eq('id', session.id);

        setActiveSession(null);
        
        const minutes = Math.floor(durationSeconds / 60);
        const seconds = durationSeconds % 60;
        
        toast.success("🎉 Climb completed!", {
          description: `Time: ${minutes}:${seconds.toString().padStart(2, '0')} | Floors: ${floorsClimbed}`
        });

        // Trigger refresh of all components
        window.dispatchEvent(new Event('activities-updated'));
        setOpen(false);
      }
    } catch (error) {
      console.error('QR code handling error:', error);
      toast.error("Failed to process QR code. Please try again.");
    }
  };

  const cancelSession = async () => {
    if (!activeSession) return;

    try {
      await supabase
        .from('qr_sessions')
        .delete()
        .eq('id', activeSession.id);

      setActiveSession(null);
      toast.info("Climbing session cancelled");
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error("Failed to cancel session");
    }
  };

  const formatSessionTime = () => {
    if (!activeSession) return "";
    const elapsed = Math.floor((Date.now() - new Date(activeSession.start_time).getTime()) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        stopScanning();
      }
    }}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 relative">
          <QrCode className="w-4 h-4" />
          Scan QR Code
          {activeSession && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Floor QR Code</DialogTitle>
          <DialogDescription>
            {activeSession 
              ? `Active session from floor ${activeSession.start_floor}. Scan a FINISH QR code.`
              : "Scan a START QR code (floors -1 or 0) to begin your climb."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {activeSession && (
            <div className="rounded-lg bg-green-50 dark:bg-green-950 p-4 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-900 dark:text-green-100">
                    🏃 Climbing in Progress
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Started from floor {activeSession.start_floor}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    Elapsed: {formatSessionTime()}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={cancelSession}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="relative">
            {!scanning ? (
              <div className="space-y-4">
                <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-muted-foreground" />
                </div>
                <Button
                  onClick={startScanning}
                  className="w-full"
                  disabled={processing}
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4 mr-2" />
                      Start Camera
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div id="qr-reader" className="rounded-lg overflow-hidden" />
                <Button
                  onClick={stopScanning}
                  variant="outline"
                  className="w-full"
                >
                  Stop Scanning
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg bg-primary/5 p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground">📱 How to use:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Scan START QR code on floor -1 or 0</li>
              <li>Climb the stairs to your target floor</li>
              <li>Scan FINISH QR code on floors 1-13</li>
              <li>Your time is automatically recorded!</li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
