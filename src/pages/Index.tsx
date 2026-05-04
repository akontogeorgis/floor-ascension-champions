import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Leaderboard from "@/components/Leaderboard";
import ActivityFeed from "@/components/ActivityFeed";
import IntegrationSection from "@/components/IntegrationSection";
import UserStats from "@/components/UserStats";
import ProgressChart from "@/components/ProgressChart";
import { useAchievementChecker } from "@/hooks/useAchievementChecker";
import { supabase } from "@/lib/supabase";

const Index = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get user ID for achievement listener
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (athleteId && supabase) {
      supabase
        .from('profiles')
        .select('id')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single()
        .then(({ data }) => {
          if (data) {
            console.log('✅ User ID found for achievement listener:', data.id);
            setUserId(data.id);
          }
        });
    }
  }, []);

  // Check for new achievements and show celebrations!
  useAchievementChecker(userId);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <div className="container py-8 space-y-8">
        <UserStats />
        <ProgressChart />
      </div>
      <Leaderboard />
      <ActivityFeed />
      <IntegrationSection />
    </div>
  );
};

export default Index;
