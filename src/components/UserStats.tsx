import { useEffect, useState } from "react";
import { supabase, formatTime } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, TrendingUp, Calendar, Target, Award } from "lucide-react";

interface Stats {
  total_climbs: number;
  verified_climbs: number;
  best_time: number;
  average_time: number;
  this_week_climbs: number;
  this_month_climbs: number;
  current_rank: number | null;
  total_points: number;
  achievement_count: number;
}

export default function UserStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) {
      setLoading(false);
      return;
    }

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, points')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Get activity stats
      const { data: activities } = await supabase
        .from('activities')
        .select('duration_seconds, created_at, verified')
        .eq('user_id', profile.id);

      const verifiedActivities = activities?.filter(a => a.verified) || [];
      const totalClimbs = activities?.length || 0;
      const verifiedClimbs = verifiedActivities.length;

      // Calculate best and average times
      const times = verifiedActivities.map(a => a.duration_seconds);
      const bestTime = times.length > 0 ? Math.min(...times) : 0;
      const averageTime = times.length > 0
        ? Math.round(times.reduce((sum, t) => sum + t, 0) / times.length)
        : 0;

      // Calculate this week's climbs
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekClimbs = verifiedActivities.filter(
        a => new Date(a.created_at) >= oneWeekAgo
      ).length;

      // Calculate this month's climbs
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const thisMonthClimbs = verifiedActivities.filter(
        a => new Date(a.created_at) >= oneMonthAgo
      ).length;

      // Get current rank
      const { data: leaderboard } = await supabase
        .from('leaderboard')
        .select('id, rank')
        .eq('id', profile.id)
        .single();

      // Get achievement count
      const { count: achievementCount } = await supabase
        .from('user_achievements')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);

      setStats({
        total_climbs: totalClimbs,
        verified_climbs: verifiedClimbs,
        best_time: bestTime,
        average_time: averageTime,
        this_week_climbs: thisWeekClimbs,
        this_month_climbs: thisMonthClimbs,
        current_rank: leaderboard?.rank || null,
        total_points: profile.points || 0,
        achievement_count: achievementCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Listen for manual sync events
    const handleUpdate = () => {
      console.log('Manual update triggered, refreshing user stats...');
      fetchStats();
    };
    
    window.addEventListener('activities-updated', handleUpdate);

    return () => {
      window.removeEventListener('activities-updated', handleUpdate);
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center animate-pulse">Loading your stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Statistics</CardTitle>
          <CardDescription>Connect to Strava to see your stats</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Statistics</CardTitle>
        <CardDescription>Personal performance overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Total Climbs */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span>Total Climbs</span>
            </div>
            <div className="text-2xl font-bold">{stats.total_climbs}</div>
            <div className="text-xs text-muted-foreground">
              {stats.verified_climbs} verified
            </div>
          </div>

          {/* Best Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Best Time</span>
            </div>
            <div className="text-2xl font-bold text-primary">
              {stats.best_time > 0 ? formatTime(stats.best_time) : "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              Avg: {stats.average_time > 0 ? formatTime(stats.average_time) : "-"}
            </div>
          </div>

          {/* Current Rank */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4" />
              <span>Rank</span>
            </div>
            <div className="text-2xl font-bold">
              {stats.current_rank ? `#${stats.current_rank}` : "-"}
            </div>
            <div className="text-xs text-muted-foreground">
              on leaderboard
            </div>
          </div>

          {/* This Week */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>This Week</span>
            </div>
            <div className="text-2xl font-bold">{stats.this_week_climbs}</div>
            <div className="text-xs text-muted-foreground">
              climbs
            </div>
          </div>

          {/* This Month */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>This Month</span>
            </div>
            <div className="text-2xl font-bold">{stats.this_month_climbs}</div>
            <div className="text-xs text-muted-foreground">
              climbs
            </div>
          </div>

          {/* Points & Achievements */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Award className="w-4 h-4" />
              <span>Achievements</span>
            </div>
            <div className="text-2xl font-bold text-primary">{stats.total_points}</div>
            <div className="text-xs text-muted-foreground">
              {stats.achievement_count} badges
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
