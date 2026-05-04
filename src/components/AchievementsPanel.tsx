import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Target, Calendar, TrendingUp, Users } from "lucide-react";
import AchievementBadge from "./AchievementBadge";
import { toast } from "sonner";

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  earned?: boolean;
  earned_at?: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  milestone: Trophy,
  performance: Target,
  consistency: Calendar,
  improvement: TrendingUp,
  social: Users,
};

export default function AchievementsPanel() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  const [earnedCount, setEarnedCount] = useState(0);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
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
      // Get user's profile ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, points')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      setTotalPoints(profile.points || 0);

      // Get all achievements
      const { data: allAchievements, error: achError } = await supabase
        .from('achievements')
        .select('*')
        .order('points', { ascending: true });

      if (achError) throw achError;

      // Get user's earned achievements
      const { data: userAchievements, error: userAchError } = await supabase
        .from('user_achievements')
        .select('achievement_id, earned_at')
        .eq('user_id', profile.id);

      if (userAchError) throw userAchError;

      // Merge data
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      const earnedMap = new Map(
        userAchievements?.map(ua => [ua.achievement_id, ua.earned_at]) || []
      );

      const merged = allAchievements?.map(ach => ({
        ...ach,
        earned: earnedIds.has(ach.id),
        earned_at: earnedMap.get(ach.id),
      })) || [];

      setAchievements(merged);
      setEarnedCount(earnedIds.size);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  const groupedAchievements = achievements.reduce((acc, ach) => {
    if (!acc[ach.category]) acc[ach.category] = [];
    acc[ach.category].push(ach);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categories = Object.keys(groupedAchievements).sort();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center animate-pulse">Loading achievements...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Achievements
            </CardTitle>
            <CardDescription>
              Unlock badges and earn points by completing challenges
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total Points</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
          <span>
            {earnedCount} / {achievements.length} unlocked
          </span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category) => {
              const Icon = categoryIcons[category] || Trophy;
              return (
                <TabsTrigger key={category} value={category} className="gap-2">
                  <Icon className="w-4 h-4" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
              {achievements.map((ach) => (
                <AchievementBadge
                  key={ach.key}
                  icon={ach.icon}
                  name={ach.name}
                  description={ach.description}
                  points={ach.points}
                  earned={ach.earned}
                  earnedAt={ach.earned_at}
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
                {groupedAchievements[category].map((ach) => (
                  <AchievementBadge
                    key={ach.key}
                    icon={ach.icon}
                    name={ach.name}
                    description={ach.description}
                    points={ach.points}
                    earned={ach.earned}
                    earnedAt={ach.earned_at}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
