import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import Leaderboard from "@/components/Leaderboard";
import ActivityFeed from "@/components/ActivityFeed";
// import PersonalDashboard from "@/components/PersonalDashboard";
import IntegrationSection from "@/components/IntegrationSection";
// import UserStats from "@/components/UserStats";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      {/* <div className="container py-8">
        <UserStats />
      </div> */}
      <Leaderboard />
      <ActivityFeed />
      <IntegrationSection />
    </div>
  );
};

export default Index;
