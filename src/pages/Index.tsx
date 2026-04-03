import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Leaderboard from "@/components/Leaderboard";
import ActivityFeed from "@/components/ActivityFeed";
import IntegrationSection from "@/components/IntegrationSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <Leaderboard />
      <ActivityFeed />
      <IntegrationSection />
    </div>
  );
};

export default Index;
