import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DepartmentSelector from "./DepartmentSelector";

// Garmin Connect OAuth Configuration
// NOTE: You need to register your app at https://connect.garmin.com/developer/
const GARMIN_OAUTH_URL = "https://connect.garmin.com/oauthConfirm";
const CLIENT_ID = import.meta.env.VITE_GARMIN_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_GARMIN_REDIRECT_URI || `${window.location.origin}/garmin/callback`;

export default function GarminConnect() {
  const [connected, setConnected] = useState(false);
  const [athleteName, setAthleteName] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showDeptSelector, setShowDeptSelector] = useState(false);
  const [department, setDepartment] = useState("Uncategorized");

  useEffect(() => {
    // Check if user already connected
    const token = localStorage.getItem("garmin_access_token");
    const name = localStorage.getItem("garmin_user_name");
    const userId = localStorage.getItem("garmin_user_id");
    
    if (token) {
      setConnected(true);
      setAthleteName(name || "");
      
      // Fetch current department from database
      if (supabase && userId) {
        supabase
          .from('profiles')
          .select('department')
          .eq('garmin_user_id', userId)
          .single()
          .then(({ data }) => {
            if (data) {
              setDepartment(data.department || "Uncategorized");
            }
          });
      }
    }
  }, []);

  const connectGarmin = () => {
    if (!CLIENT_ID) {
      toast.error("Garmin integration not configured. Please add VITE_GARMIN_CLIENT_ID to .env.local");
      return;
    }

    // Garmin uses OAuth 1.0a which is more complex than OAuth 2.0
    // For simplicity, we'll show instructions on how to set it up
    toast.info("Garmin OAuth 1.0a requires backend setup. See GARMIN_INTEGRATION.md for details.", {
      duration: 5000,
    });
    
    // This would be the OAuth flow once backend is set up:
    // const authUrl = `${GARMIN_OAUTH_URL}?oauth_callback=${encodeURIComponent(REDIRECT_URI)}`;
    // window.location.href = authUrl;
  };

  const disconnect = () => {
    localStorage.removeItem("garmin_access_token");
    localStorage.removeItem("garmin_access_secret");
    localStorage.removeItem("garmin_user_name");
    localStorage.removeItem("garmin_user_id");
    setConnected(false);
    setAthleteName("");
    setDepartment("Uncategorized");
    toast.success("Disconnected from Garmin");
  };

  const syncActivities = async () => {
    setSyncing(true);
    
    try {
      const token = localStorage.getItem("garmin_access_token");
      const userId = localStorage.getItem("garmin_user_id");
      
      if (!token) {
        toast.error("Not connected to Garmin");
        return;
      }

      toast.info("Fetching activities from Garmin...");

      // Garmin API endpoint for activities
      // NOTE: Garmin uses OAuth 1.0a, requires signed requests
      const response = await fetch(
        `https://apis.garmin.com/wellness-api/rest/activities`,
        {
          headers: { 
            Authorization: `OAuth ${token}`,
            // OAuth 1.0a requires additional signing headers
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities from Garmin");
      }

      const activities = await response.json();
      let imported = 0;
      let skipped = 0;

      // Find profile by Garmin user ID
      let profile = null;
      if (supabase && userId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('garmin_user_id', userId)
          .single();
        
        profile = data;

        if (!profile) {
          toast.error("Profile not found! Please disconnect and reconnect Garmin.");
          setSyncing(false);
          return;
        }
      }

      // Filter and validate activities
      for (const activity of activities) {
        const elevation = activity.elevationGain;
        const distance = activity.distance;
        
        // Validate: stair climb activity
        if (distance < 200 && elevation >= 15 && elevation <= 35) {
          if (supabase) {
            // Check if already imported
            const { data: existing } = await supabase
              .from('activities')
              .select('id')
              .eq('source', 'garmin')
              .eq('start_time', activity.startTime)
              .single();

            if (existing) {
              skipped++;
              continue;
            }

            // Insert into database
            const { error } = await supabase.from("activities").insert({
              user_id: profile?.id || null,
              duration_seconds: activity.duration,
              elevation_gain_meters: elevation,
              source: "garmin",
              verified: true,
              is_personal_best: false,
              start_time: activity.startTime,
              end_time: new Date(
                new Date(activity.startTime).getTime() + activity.duration * 1000
              ).toISOString(),
              gps_start_lat: activity.startLatitude,
              gps_start_lon: activity.startLongitude,
            });

            if (!error) {
              imported++;
            }
          }
        }
      }

      if (imported > 0) {
        toast.success(`✅ Synced ${imported} stair climbing activities!${skipped > 0 ? ` (${skipped} already imported)` : ''}`);
        window.dispatchEvent(new Event('activities-updated'));
      } else if (skipped > 0) {
        toast.info(`All ${skipped} activities already imported!`);
      } else {
        toast.info("No stair climbing activities found");
      }
    } catch (error) {
      console.error("Sync error:", error);
      toast.error("Failed to sync activities. Garmin requires backend OAuth setup.");
    } finally {
      setSyncing(false);
    }
  };

  const userId = localStorage.getItem("garmin_user_id") || "";

  if (connected) {
    return (
      <>
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-secondary/50">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Garmin Connected</p>
                {athleteName && <p className="text-xs text-muted-foreground">{athleteName}</p>}
                <p className="text-xs text-muted-foreground">{department}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeptSelector(true)}
              className="gap-1"
            >
              <Settings className="w-3 h-3" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={syncActivities}
              disabled={syncing}
              className="gap-2 flex-1"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? "Syncing..." : "Sync Now"}
            </Button>
            <Button variant="outline" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          </div>
        </div>

        <DepartmentSelector
          open={showDeptSelector}
          onClose={() => {
            setShowDeptSelector(false);
            // Refresh department display
            if (supabase && userId) {
              supabase
                .from('profiles')
                .select('department')
                .eq('garmin_user_id', userId)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setDepartment(data.department || "Uncategorized");
                  }
                });
            }
          }}
          athleteId={userId}
          currentDepartment={department}
        />
      </>
    );
  }

  return (
    <Button onClick={connectGarmin} className="w-full" variant="outline">
      <Activity className="w-4 h-4 mr-2" />
      Connect Garmin
    </Button>
  );
}
