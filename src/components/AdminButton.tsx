import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function AdminButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    if (!supabase) return;

    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      setIsAdmin(profile?.is_admin || false);
    } catch (error) {
      // Silently fail - not critical
      console.log('Could not check admin status');
    }
  };

  if (!isAdmin) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate('/admin')}
      className="gap-2 text-white hover:bg-white/20 border-white/30"
    >
      <Shield className="w-4 h-4" />
      <span className="font-medium">Admin</span>
    </Button>
  );
}
