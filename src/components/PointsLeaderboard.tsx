import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award } from "lucide-react";

interface PointsEntry {
  rank: number;
  full_name: string;
  department: string;
  avatar_initials: string;
  points: number;
  achievement_count: number;
}

export default function PointsLeaderboard() {
  const [entries, setEntries] = useState<PointsEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPointsLeaderboard();
  }, []);

  const fetchPointsLeaderboard = async () => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('points_leaderboard')
        .select('*')
        .limit(10);

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching points leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center animate-pulse">Loading leaderboard...</div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Points Leaderboard
          </CardTitle>
          <CardDescription>Top achievers by total points</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No achievements earned yet. Be the first!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Points Leaderboard
        </CardTitle>
        <CardDescription>Top achievers by total points</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-3 rounded-lg ${
                entry.rank <= 3 ? "bg-primary/5 border border-primary/20" : "bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    entry.rank === 1
                      ? "bg-gold text-gold-foreground"
                      : entry.rank === 2
                      ? "bg-silver text-silver-foreground"
                      : entry.rank === 3
                      ? "bg-bronze text-bronze-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {entry.rank}
                </div>
                <div className="w-10 h-10 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-sm font-bold">
                  {entry.avatar_initials}
                </div>
                <div>
                  <p className="font-semibold">{entry.full_name}</p>
                  <p className="text-xs text-muted-foreground">{entry.department}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg text-primary flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {entry.points}
                </div>
                <div className="text-xs text-muted-foreground">
                  {entry.achievement_count} {entry.achievement_count === 1 ? 'badge' : 'badges'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
