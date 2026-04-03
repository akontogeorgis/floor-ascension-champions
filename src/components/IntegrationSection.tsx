import { Smartphone, Watch, Activity } from "lucide-react";

const integrations = [
  {
    name: "Garmin Connect",
    description: "Sync stair climbing activities automatically from your Garmin watch",
    icon: <Watch className="w-8 h-8" />,
    status: "Coming Soon",
    color: "text-primary",
  },
  {
    name: "Strava",
    description: "Import your stair runs from Strava activities",
    icon: <Activity className="w-8 h-8" />,
    status: "Coming Soon",
    color: "text-primary",
  },
  {
    name: "Apple Watch",
    description: "Track floors climbed with Apple Health integration",
    icon: <Smartphone className="w-8 h-8" />,
    status: "Coming Soon",
    color: "text-primary",
  },
];

const IntegrationSection = () => {
  return (
    <section className="container py-12 pb-20">
      <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Integrations</h2>
      <p className="text-muted-foreground mb-8">Connect your device to auto-sync climbs</p>

      <div className="grid md:grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.name}
            className="card-gradient rounded-xl border border-border p-6 hover:border-primary/30 transition-all group"
          >
            <div className={`${integration.color} mb-4 group-hover:scale-110 transition-transform`}>
              {integration.icon}
            </div>
            <h3 className="font-bold text-foreground text-lg mb-1">{integration.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary">
              {integration.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default IntegrationSection;
