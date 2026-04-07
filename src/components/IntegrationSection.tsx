import { Smartphone, Watch, Activity } from "lucide-react";
import StravaConnect from "./StravaConnect";
import GarminConnect from "./GarminConnect";

const IntegrationSection = () => {
  return (
    <section className="container py-12 pb-20">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Integrations</h2>
      <p className="text-muted-foreground mb-8">Connect your device to auto-sync climbs</p>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Garmin Connect */}
        <div className="card-gradient rounded-xl border border-border p-6 hover:border-primary/30 transition-all group">
          <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
            <Watch className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-foreground text-lg mb-1">Garmin Connect</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sync stair climbing activities from your Garmin watch
          </p>
          
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            Coming Soon
          </span>
          {/* <div className="mt-4">
            <GarminConnect />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            <a href="/GARMIN_INTEGRATION.md" className="text-primary hover:underline">
              Setup required - See integration guide
            </a>
          </p> */}
        </div>

        {/* Strava */}
        <div className="card-gradient rounded-xl border border-border p-6 hover:border-primary/30 transition-all group">
          <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-foreground text-lg mb-1">Strava</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Import your stair runs from Strava activities
          </p>
          <div className="mt-4">
            <StravaConnect />
          </div>
        </div>

        {/* Apple Watch */}
        <div className="card-gradient rounded-xl border border-border p-6 hover:border-primary/30 transition-all group">
          <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-foreground text-lg mb-1">Apple Watch</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Track floors climbed with Apple Health integration
          </p>
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
            Coming Soon
          </span>
        </div>
      </div>
    </section>
  );
};

export default IntegrationSection;
