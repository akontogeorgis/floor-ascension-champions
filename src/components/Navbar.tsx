import { Flame, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AdminButton from "./AdminButton";
import ThemeToggle from "./ThemeToggle";

const Navbar = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="sticky top-0 z-50 border-b border-primary/20 bg-primary shadow-lg">
      <div className="container flex items-center justify-between h-14">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-white" />
            <span className="text-white text-sm"
            
             // fontFamily: "'Roboto Condensed', sans-serif", fontWeight: 300, letterSpacing: '0.15em' }}
            //  fontFamily: "'Orbitron', sans-serif !important",fontWeight: 900,letterSpacing: '2px'}}
            style={{  fontFamily: "'Orbitron', sans-serif !important",fontWeight: 900,letterSpacing: '2px'}}>
              OTE <span className="mx-1 opacity-60">|</span> <span style={{ fontFamily: "'Orbitron', sans-serif !important",fontWeight: 900,letterSpacing: '2px' }}>StairRush</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/achievements')}
            className="gap-2 text-white hover:bg-white/20 border-white/30"
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline font-medium">Achievements</span>
          </Button>
          <AdminButton />
          <div className="text-xs text-white/90 font-medium tracking-wide hidden md:block">
            COSMOTE HQ · Maroussi
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
