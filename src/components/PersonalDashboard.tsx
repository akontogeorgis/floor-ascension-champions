import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Calendar, Flame } from "lucide-react";
import { supabase, formatTime } from "@/lib/supabase";

interface Activity {
  id: string;
  duration_seconds: number;
  elevation_gain_meters: number;
  start_time: string;
  source: string;
}

interface PersonalStats {
  bestTime: number;
  totalClimbs: number;
  weekClimbs: number;
  avgTime: number;
  personalBest: boolean;
}

const PersonalDashboard = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<PersonalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPersonalData = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const athleteId = localStorage.getItem("strava_athlete_id");
      if (!athleteId) {
        setLoading(false);
        return;
      }

      try {
        // Get user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('strava_athlete_id', parseInt(athleteId))
          .single();

        if (!profile) {
          setLoading(false);
          return;
        }

        // Get user's activities
        const { data: userActivities, error } = await supabase
          .from('activities')
          .select('*')
          .eq('user_id', profile.id)
          .order('start_time', { ascending: false });

        if (error) throw error;

        if (userActivities && userActivities.length > 0) {
          setActivities(userActivities);

          // Calculate stats
          const times = userActivities.map(a => a.duration_seconds);
          const bestTime = Math.min(...times);
          const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - 7);
          const weekClimbs = userActivities.filter(
            a => new Date(a.start_time) >= weekStart
          ).length;

          setStats({
            bestTime,
            totalClimbs: userActivities.length,
            weekClimbs,
            avgTime,
            personalBest: true
          });
        }
      } catch (error) {
        console.error('Error fetching personal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalData();

    // Subscribe to updates
    if (supabase) {
      const channel = supabase
        .channel('personal_activities')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'activities',
        }, () => {
          fetchPersonalData();
        })
        .subscribe();

      window.addEventListener('activities-updated', fetchPersonalData);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('activities-updated', fetchPersonalData);
      };
    }
  }, []);

  if (loading) {
    return (
      <section className="container py-12">
        <div className="text-center py-12">
          <div className="animate-pulse">Loading your stats...</div>
        </div>
      </section>
    );
  }

  const athleteId = localStorage.getItem("strava_athlete_id");
  if (!athleteId) {
    return (
      <section className="container py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Connect Strava to see your personal dashboard</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Your Stats</h2>
      </div>

      {/* Personal Stats Cards */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="card-gradient rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Best Time</h3>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono">
              {formatTime(stats.bestTime)}
            </p>
            {stats.personalBest && (
              <p className="text-xs text-primary mt-1">Personal Record! 🏆</p>
            )}
          </div>

          <div className="card-gradient rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Total Climbs</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.totalClimbs}
            </p>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </div>

          <div className="card-gradient rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">This Week</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {stats.weekClimbs}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </div>

          <div className="card-gradient rounded-xl border border-border p-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-sm font-medium text-muted-foreground">Avg Time</h3>
            </div>
            <p className="text-3xl font-bold text-foreground font-mono">
              {formatTime(Math.round(stats.avgTime))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Average</p>
          </div>
        </div>
      )}

      {/* Activity History */}
      <div className="card-gradient rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Your Activity History</h3>
          <p className="text-sm text-muted-foreground mt-1">
            All your stair climbing activities
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">No activities yet. Connect Strava and sync to get started!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-right">Time</th>
                  <th className="px-6 py-3 text-right">Elevation</th>
                  <th className="px-6 py-3 text-center">Source</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((activity) => {
                  const date = new Date(activity.start_time);
                  const isBest = stats && activity.duration_seconds === stats.bestTime;
                  
                  return (
                    <tr
                      key={activity.id}
                      className={`border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                        isBest ? "bg-primary/[0.05]" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">
                            {date.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {date.toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-mono font-bold ${isBest ? 'text-primary' : 'text-foreground'}`}>
                          {formatTime(activity.duration_seconds)}
                        </span>
                        {isBest && (
                          <span className="ml-2 text-xs">🏆</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-muted-foreground">
                        {activity.elevation_gain_meters.toFixed(1)}m
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                          {activity.source === 'strava' ? '🏃 Strava' : 
                           activity.source === 'garmin' ? '⌚ Garmin' : 
                           '⌚ ' + activity.source}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {activities.length > 0 && stats && (
        <div className="mt-6 p-4 rounded-lg bg-secondary/30 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            Keep climbing to beat your personal best! 💪
          </p>
        </div>
      )}
    </section>
  );
};

export default PersonalDashboard;
