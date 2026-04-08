import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Activity, RefreshCw, Settings } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DepartmentSelector from "./DepartmentSelector";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
// Use current origin to handle dynamic ports
const REDIRECT_URI = import.meta.env.VITE_STRAVA_REDIRECT_URI || `${window.location.origin}/strava/callback`;

export default function StravaConnect() {
  const [connected, setConnected] = useState(false);
  const [athleteName, setAthleteName] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [showDeptSelector, setShowDeptSelector] = useState(false);
  const [department, setDepartment] = useState("Uncategorized");

  useEffect(() => {
    // Check if user already connected
    const token = localStorage.getItem("strava_access_token");
    const name = localStorage.getItem("strava_athlete_name");
    const athleteId = localStorage.getItem("strava_athlete_id");
    
    if (token) {
      setConnected(true);
      setAthleteName(name || "");
      
      // Fetch current department from database
      if (supabase && athleteId) {
        supabase
          .from('profiles')
          .select('department')
          .eq('strava_athlete_id', parseInt(athleteId))
          .single()
          .then(({ data }) => {
            if (data) {
              setDepartment(data.department || "Uncategorized");
            }
          });
      }

      // AUTO-SYNC: Check if we should sync automatically
      const lastSync = localStorage.getItem("last_strava_sync");
      const lastSyncTime = lastSync ? parseInt(lastSync) : 0;
      const hoursSinceLastSync = (Date.now() - lastSyncTime) / (1000 * 60 * 60);
      
      // Auto-sync if last sync was more than 1 hours ago (or never synced)
      if (hoursSinceLastSync >= 1 || !lastSync) {
        console.log(`Auto-syncing activities (last sync: ${hoursSinceLastSync.toFixed(1)} hours ago)`);
        // Delay slightly to let the UI load first
        setTimeout(() => {
          syncActivities(true); // true = silent sync
        }, 2000);
      } else {
        console.log(`No auto-sync needed (last sync: ${hoursSinceLastSync.toFixed(1)} hours ago)`);
      }
    }
  }, []);

  const connectStrava = () => {
    const scope = "activity:read_all";
    const authUrl = `${STRAVA_AUTH_URL}?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  const disconnect = (silent = false) => {
    const token = localStorage.getItem("strava_access_token");
    
    // Revoke token on Strava side to actually free up the athlete slot
    if (token) {
      fetch("https://www.strava.com/oauth/deauthorize", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.log("Deauthorize error (non-critical):", err));
    }
    
    localStorage.removeItem("strava_access_token");
    localStorage.removeItem("strava_refresh_token");
    localStorage.removeItem("strava_athlete_name");
    localStorage.removeItem("strava_athlete_id");
    setConnected(false);
    setAthleteName("");
    setDepartment("Uncategorized");
    
    if (!silent) {
      toast.success("Disconnected from Strava");
    }
  };

  const syncActivities = async (silent = false) => {
    setSyncing(true);
    
    try {
      const token = localStorage.getItem("strava_access_token");
      const athleteId = localStorage.getItem("strava_athlete_id");
      
      if (!token) {
        if (!silent) toast.error("Not connected to Strava");
        setSyncing(false);
        return;
      }

      if (!silent) {
        toast.info("Fetching activities from Strava...");
      } else {
        console.log("Silently syncing activities in background...");
      }

      // Fetch recent activities from Strava
      const response = await fetch(
        "https://www.strava.com/api/v3/athlete/activities?per_page=30",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch activities from Strava");
      }

      const activities = await response.json();
      let imported = 0;
      let skipped = 0;

      // Find profile by Strava athlete ID (reliable!)
      let profile = null;
      if (supabase && athleteId) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('strava_athlete_id', parseInt(athleteId))
          .single();
        
        profile = data;

        if (!profile) {
          toast.error("Profile not found! Please disconnect and reconnect Strava to create your profile.");
          setSyncing(false);
          return;
        } else {
          toast.info(`Syncing activities for ${profile.full_name}...`);
        }
      } else if (!athleteId) {
        toast.error("No athlete ID found. Please reconnect Strava.");
        setSyncing(false);
        return;
      }

      // Filter and validate activities
      for (const activity of activities) {
        // Check if it's a stair climb (elevation ~25m for 7 floors)
        const elevation = activity.total_elevation_gain;
        const distance = activity.distance; // in meters
        
        // Validate: elevation 15-35m, distance < 200m (stair climb, not a run)
        // if (elevation >= 15 && elevation <= 35 && distance < 200) {
        if (distance < 200) {
          const startLat = activity.start_latlng?.[0];
          const startLng = activity.start_latlng?.[1];
          
          if (supabase) {
            // Check if already imported
            const { data: existing } = await supabase
              .from('activities')
              .select('id')
              .eq('source', 'strava')
              .gte('start_time', activity.start_date)
              .lte('start_time', activity.start_date)
              .single();

            if (existing) {
              skipped++;
              continue;
            }

            // Insert into database
            const { error } = await supabase.from("activities").insert({
              user_id: profile?.id || null,
              duration_seconds: activity.elapsed_time,
              elevation_gain_meters: elevation,
              source: "strava",
              verified: true,
              is_personal_best: false,
              start_time: activity.start_date,
              end_time: new Date(
                new Date(activity.start_date).getTime() +
                  activity.elapsed_time * 1000
              ).toISOString(),
              gps_start_lat: startLat,
              gps_start_lon: startLng,
            });

            if (!error) {
              imported++;
            } else {
              console.error("Error inserting activity:", error);
            }
          }
        }
      }

      // Save last sync timestamp
      localStorage.setItem("last_strava_sync", Date.now().toString());

      if (imported > 0) {
        if (!silent) {
          toast.success(`✅ Synced ${imported} stair climbing activities!${skipped > 0 ? ` (${skipped} already imported)` : ''}`);
        } else {
          console.log(`Auto-sync: Imported ${imported} new activities`);
          toast.success(`🔄 Auto-synced ${imported} new activities!`, { duration: 3000 });
        }
        
        // Trigger a refresh by dispatching a custom event
        window.dispatchEvent(new Event('activities-updated'));
        
        // Auto-disconnect after successful sync to free up athlete slot for others
        // Silent disconnect - no toast notification
        setTimeout(() => {
          console.log("Auto-disconnecting to free athlete slot for others...");
          disconnect(true); // true = silent disconnect
        }, 2000); // 2 second delay to ensure sync completes
      } else if (skipped > 0) {
        if (!silent) {
          toast.info(`All ${skipped} activities already imported!`);
        } else {
          console.log(`Auto-sync: All ${skipped} activities already imported`);
        }
        
        // Disconnect even if no new activities (already synced before)
        setTimeout(() => {
          console.log("Auto-disconnecting (no new activities)...");
          disconnect(true);
        }, 2000);
      } else {
        if (!silent) {
          toast.info("No stair climbing activities found (looking for ~25m elevation gain)");
        } else {
          console.log("Auto-sync: No new activities found");
        }
        
        // Disconnect even if no activities found
        setTimeout(() => {
          console.log("Auto-disconnecting (no activities found)...");
          disconnect(true);
        }, 2000);
      }
    } catch (error) {
      console.error("Sync error:", error);
      if (!silent) {
        toast.error("Failed to sync activities. Check console for details.");
      }
    } finally {
      setSyncing(false);
    }
  };

  const athleteId = localStorage.getItem("strava_athlete_id") || "";

  if (connected) {
    return (
      <>
        <div className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-secondary/50">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground">Strava Connected</p>
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
            if (supabase && athleteId) {
              supabase
                .from('profiles')
                .select('department')
                .eq('strava_athlete_id', parseInt(athleteId))
                .single()
                .then(({ data }) => {
                  if (data) {
                    setDepartment(data.department || "Uncategorized");
                  }
                });
            }
          }}
          athleteId={athleteId}
          currentDepartment={department}
        />
      </>
    );
  }

  return (
    <Button onClick={connectStrava} className="w-full">
      <Activity className="w-4 h-4 mr-2" />
      Connect Strava
    </Button>
  );
}