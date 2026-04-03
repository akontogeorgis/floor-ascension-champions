import { Trophy, TrendingUp, Flame } from "lucide-react";

interface ClimbEntry {
  rank: number;
  name: string;
  department: string;
  bestTime: string;
  totalClimbs: number;
  streak: number;
  source: "garmin" | "strava" | "apple";
  avatarInitials: string;
  trend: "up" | "down" | "same";
}

const mockData: ClimbEntry[] = [
  { rank: 1, name: "Apostolopoulos", department: "Senior Troublemakers", bestTime: "1:42", totalClimbs: 47, streak: 12, source: "garmin", avatarInitials: "AP", trend: "same" },
  { rank: 2, name: "Rizou", department: "0100101101", bestTime: "1:48", totalClimbs: 38, streak: 8, source: "strava", avatarInitials: "RI", trend: "up" },
  { rank: 3, name: "Kirpitsas", department: "Orchestrators", bestTime: "1:55", totalClimbs: 52, streak: 15, source: "apple", avatarInitials: "KI", trend: "up" },
  { rank: 4, name: "Mantoudaki", department: "0100101101", bestTime: "2:03", totalClimbs: 29, streak: 5, source: "garmin", avatarInitials: "MA", trend: "down" },
  { rank: 5, name: "Tsaltas", department: "Digital Alchemists", bestTime: "2:08", totalClimbs: 34, streak: 3, source: "strava", avatarInitials: "TS", trend: "up" },
  { rank: 6, name: "KanellopoulosK", department: "Orchestrators", bestTime: "2:15", totalClimbs: 21, streak: 7, source: "apple", avatarInitials: "KK", trend: "same" },
  { rank: 7, name: "Simoni", department: "0100101101", bestTime: "2:22", totalClimbs: 18, streak: 2, source: "garmin", avatarInitials: "SI", trend: "down" },
  { rank: 8, name: "Theodorakos", department: "0100101101", bestTime: "2:30", totalClimbs: 15, streak: 4, source: "strava", avatarInitials: "TH", trend: "up" },
  { rank: 9, name: "Aggeli", department: "Orchestrators", bestTime: "2:35", totalClimbs: 13, streak: 6, source: "apple", avatarInitials: "AG", trend: "up" },
  { rank: 10, name: "Mpotsios", department: "Orchestrators", bestTime: "2:41", totalClimbs: 11, streak: 3, source: "garmin", avatarInitials: "MP", trend: "same" },
  { rank: 11, name: "Koukoulis", department: "0100101101", bestTime: "2:48", totalClimbs: 9, streak: 1, source: "strava", avatarInitials: "KO", trend: "down" },
  { rank: 12, name: "Tsakas", department: "Senior Troublemakers", bestTime: "2:55", totalClimbs: 8, streak: 2, source: "garmin", avatarInitials: "TS", trend: "up" },
  { rank: 13, name: "Davilla", department: "Orchestrators", bestTime: "3:02", totalClimbs: 6, streak: 1, source: "apple", avatarInitials: "DA", trend: "same" },
  { rank: 14, name: "Mparmpopoulou", department: "Digital Alchemists", bestTime: "3:10", totalClimbs: 5, streak: 1, source: "strava", avatarInitials: "MB", trend: "up" },
];

const sourceIcons: Record<string, string> = {
  garmin: "⌚",
  strava: "🏃",
  apple: "⌚",
};

const sourceLabels: Record<string, string> = {
  garmin: "Garmin",
  strava: "Strava",
  apple: "Apple",
};

const Leaderboard = () => {
  return (
    <section className="container py-12">
      <div className="flex items-center gap-3 mb-8">
        <Trophy className="w-6 h-6 text-primary" />
        <h2 className="text-2xl md:text-3xl font-bold text-foreground">Leaderboard</h2>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-2xl mx-auto">
        {[mockData[1], mockData[0], mockData[2]].map((entry, i) => {
          const podiumOrder = [2, 1, 3];
          const colors = ["text-silver", "text-gold", "text-bronze"];
          const sizes = ["pt-6", "pt-0", "pt-8"];
          const medals = ["🥈", "🥇", "🥉"];
          return (
            <div key={entry.rank} className={`flex flex-col items-center ${sizes[i]}`}>
              <div className="text-3xl mb-2">{medals[i]}</div>
              <div className={`w-14 h-14 rounded-full bg-secondary border-2 ${
                podiumOrder[i] === 1 ? "border-gold" : podiumOrder[i] === 2 ? "border-silver" : "border-bronze"
              } flex items-center justify-center font-bold text-foreground mb-2`}>
                {entry.avatarInitials}
              </div>
              <span className="font-semibold text-foreground text-sm">{entry.name}</span>
              <span className="font-mono font-bold text-primary text-lg">{entry.bestTime}</span>
              <span className="text-xs text-muted-foreground">{entry.department}</span>
            </div>
          );
        })}
      </div>

      {/* Full table */}
      <div className="card-gradient rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Athlete</th>
                <th className="px-4 py-3 text-left hidden sm:table-cell">Dept</th>
                <th className="px-4 py-3 text-right">Best Time</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Climbs</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Streak</th>
                <th className="px-4 py-3 text-center hidden sm:table-cell">Source</th>
              </tr>
            </thead>
            <tbody>
              {mockData.map((entry) => (
                <tr
                  key={entry.rank}
                  className={`border-b border-border/50 transition-colors hover:bg-secondary/50 ${
                    entry.rank <= 3 ? "bg-primary/[0.03]" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${
                      entry.rank === 1 ? "text-gold" : entry.rank === 2 ? "text-silver" : entry.rank === 3 ? "text-bronze" : "text-muted-foreground"
                    }`}>
                      {entry.rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-foreground">
                        {entry.avatarInitials}
                      </div>
                      <div>
                        <span className="font-semibold text-foreground">{entry.name}</span>
                        {entry.trend === "up" && <TrendingUp className="w-3 h-3 text-success inline ml-1" />}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm hidden sm:table-cell">{entry.department}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono font-bold text-foreground">{entry.bestTime}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground font-mono hidden md:table-cell">{entry.totalClimbs}</td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <div className="flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 text-primary" />
                      <span className="font-mono text-foreground">{entry.streak}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                      {sourceIcons[entry.source]} {sourceLabels[entry.source]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default Leaderboard;
