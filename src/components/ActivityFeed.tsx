import { Clock, ArrowUp } from "lucide-react";

interface Activity {
  id: number;
  name: string;
  time: string;
  timeAgo: string;
  source: string;
  isPersonalBest: boolean;
}

const recentActivities: Activity[] = [
  { id: 1, name: "Apostolopoulos", time: "1:42", timeAgo: "2h ago", source: "Garmin", isPersonalBest: true },
  { id: 2, name: "Rizou", time: "1:52", timeAgo: "3h ago", source: "Strava", isPersonalBest: false },
  { id: 3, name: "Kirpitsas", time: "1:55", timeAgo: "5h ago", source: "Apple Watch", isPersonalBest: true },
  { id: 4, name: "Mantoudaki", time: "2:10", timeAgo: "Yesterday", source: "Garmin", isPersonalBest: false },
  { id: 5, name: "Tsaltas", time: "2:08", timeAgo: "Yesterday", source: "Strava", isPersonalBest: false },
];

const ActivityFeed = () => {
  return (
    <section className="container py-12">
      <div className="flex items-center gap-3 mb-8">
        <Clock className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Recent Climbs</h2>
      </div>

      <div className="grid gap-3 max-w-2xl">
        {recentActivities.map((activity, i) => (
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
