import { Flame } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground tracking-tight">
            OTE <span className="text-gradient">StairRush</span>
          </span>
        </div>
        <div className="text-xs text-muted-foreground font-mono">
          COSMOTE HQ · Maroussi
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
