import { useEffect, useState } from "react";
import { Clock, ArrowUp } from "lucide-react";
import { supabase, formatTime, timeAgo } from "@/lib/supabase";

interface Activity {
  id: number;
  name: string;
  time: string;
  timeAgo: string;
  source: string;
  isPersonalBest: boolean;
}

interface SupabaseActivity {
  id: string;
  duration_seconds: number;
  source: string;
  is_personal_best: boolean;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_initials?: string;
  };
}

const recentActivities: Activity[] = [
  { id: 1, name: "Apostolopoulos", time: "1:42", timeAgo: "2h ago", source: "Garmin", isPersonalBest: true },
  { id: 2, name: "Rizou", time: "1:52", timeAgo: "3h ago", source: "Strava", isPersonalBest: false },
  { id: 3, name: "Kirpitsas", time: "1:55", timeAgo: "5h ago", source: "Apple Watch", isPersonalBest: true },
  { id: 4, name: "Mantoudaki", time: "2:10", timeAgo: "Yesterday", source: "Garmin", isPersonalBest: false },
  { id: 5, name: "Tsaltas", time: "2:08", timeAgo: "Yesterday", source: "Strava", isPersonalBest: false },
];

const sourceLabels: Record<string, string> = {
  garmin: "Garmin",
  strava: "Strava",
  apple: "Apple Watch",
  manual: "Manual",
};

const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>(recentActivities);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      if (!supabase) {
        // No Supabase configured, use mock data
        setLoading(false);
        return;
      }

      try {
        // Fetch activities with profile data
        const { data: activitiesData, error } = await supabase
          .from('activities')
          .select(`
            id,
            duration_seconds,
            source,
            is_personal_best,
            created_at,
            profiles!inner (
              full_name,
              avatar_initials
            )
          `)
          .eq('verified', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        if (activitiesData && activitiesData.length > 0) {
          // Transform Supabase data to match component interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const transformedActivities: Activity[] = activitiesData.map((item: any, index: number) => {
            const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
            return {
              id: index + 1,
              name: profile?.full_name || 'Unknown',
              time: formatTime(item.duration_seconds),
              timeAgo: timeAgo(item.created_at),
              source: sourceLabels[item.source] || item.source,
              isPersonalBest: item.is_personal_best || false,
            };
          });

          setActivities(transformedActivities);
        }
      } catch (error) {
        console.error('Error fetching activities:', error);
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();

    // Subscribe to real-time updates
    if (supabase) {
      const channel = supabase
        .channel('recent_activities_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities',
          },
          () => {
            // Refresh activities when changes occur
            fetchActivities();
          }
        )
        .subscribe();

      // Listen for manual sync events
      const handleManualUpdate = () => {
        console.log('Manual update triggered, refreshing activity feed...');
        fetchActivities();
      };
      
      window.addEventListener('activities-updated', handleManualUpdate);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('activities-updated', handleManualUpdate);
      };
    }
  }, []);

  if (loading) {
    return (
      <section className="container py-12">
        <div className="flex items-center gap-3 mb-8">
          <Clock className="w-6 h-6 text-primary" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recent Climbs</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-pulse">Loading recent activities...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="container py-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recent Climbs</h2>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {activities.map((activity, i) => (
          <div
            key={activity.id}
            className="flex items-center justify-between px-5 py-4 rounded-xl bg-secondary/50 border border-border hover:border-primary/20 transition-all animate-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-4">
              <ArrowUp className="w-5 h-5 text-success" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{activity.name}</span>
                  {activity.isPersonalBest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary uppercase tracking-wider">
                      PB
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{activity.source} · {activity.timeAgo}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-lg text-foreground">{activity.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ActivityFeed;
