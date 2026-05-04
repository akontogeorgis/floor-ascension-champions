import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import AchievementsPanel from "@/components/AchievementsPanel";
import PointsLeaderboard from "@/components/PointsLeaderboard";

export default function Achievements() {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const athleteId = localStorage.getItem('strava_athlete_id');
    setIsConnected(!!athleteId);
  }, []);

  if (!isConnected) {
    return (
      <div className="container py-12">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Achievements</h1>
          <p className="text-muted-foreground mb-8">
            Connect to Strava to unlock achievements and earn points!
          </p>
          <Button onClick={() => navigate("/")}>
            Go to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <AchievementsPanel />
          </div>
          <div>
            <PointsLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
