import { ArrowUp, Building, Timer } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      
      <div className="container relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-slide-up">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-sm font-medium text-primary">Live Challenge</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <span className="text-foreground">OTE</span>{" "}
          <span className="text-gradient">StairRush</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          Race from Floor <span className="font-mono font-bold text-foreground">-1</span> to Floor{" "}
          <span className="font-mono font-bold text-foreground">6</span>. 
          7 floors. No elevator. Who's the fastest?
        </p>

        <div className="flex flex-wrap justify-center gap-6 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Stat icon={<Building className="w-5 h-5" />} value="7" label="Floors" />
          <Stat icon={<ArrowUp className="w-5 h-5" />} value="~25m" label="Elevation" />
          <Stat icon={<Timer className="w-5 h-5" />} value="~140" label="Steps" />
        </div>

        {/* Floor visualization */}
        <div className="flex justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex flex-col items-center gap-1">
            {[6, 5, 4, 3, 2, 1, 0, -1].map((floor) => (
              <div
                key={floor}
                className={`flex items-center gap-3 px-4 py-1.5 rounded-md text-sm font-mono font-bold transition-all ${
                  floor === 6
                    ? "bg-primary/20 text-primary border border-primary/30 scale-105"
                    : floor === -1
                    ? "bg-success/15 text-success border border-success/30 scale-105"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                <span className="w-14 text-right">F{floor >= 0 ? floor : floor}</span>
                {floor === 6 && <span className="text-xs">🏁 FINISH</span>}
                {floor === -1 && <span className="text-xs">🚀 START</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Stat = ({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) => (
  <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-secondary border border-border">
    <div className="text-primary">{icon}</div>
    <div className="text-left">
      <div className="font-mono font-bold text-foreground text-lg">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  </div>
);

export default HeroSection;
