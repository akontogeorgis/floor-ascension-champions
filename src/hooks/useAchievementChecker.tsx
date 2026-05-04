import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

interface Achievement {
  key: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  category: string;
  earned_at: string;
}

// Celebration with confetti
const celebrateAchievement = (achievement: Achievement) => {
  const { name, icon, points, category } = achievement;

  // Confetti based on category
  switch (category) {
    case 'milestone':
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FFA500', '#FF6B35']
      });
      break;
    
    case 'performance':
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#FFD700', '#FFA500']
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#FFD700', '#FFA500']
      });
      break;
    
    default:
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
  }

  // Toast notification
  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-4xl animate-bounce">{icon}</span>
      <div>
        <div className="font-bold text-lg">Achievement Unlocked!</div>
        <div className="text-sm mt-1">{name}</div>
        <div className="text-xs opacity-75 mt-1">+{points} points earned</div>
      </div>
    </div>,
    {
      duration: 6000,
      style: {
        background: 'linear-gradient(135deg, hsl(330, 100%, 50%), hsl(300, 80%, 55%))',
        color: 'white',
        border: '2px solid hsl(330, 100%, 60%)',
        boxShadow: '0 0 20px hsl(330, 100%, 50% / 0.5)',
      },
    }
  );
};

// Check for new achievements (fallback when websocket doesn't work)
export const useAchievementChecker = (userId: string | null) => {
  const lastCheckRef = useRef<string | null>(null);

  useEffect(() => {
    if (!supabase || !userId) return;

    const checkForNewAchievements = async () => {
      try {
        // Get achievements earned in last 10 seconds
        const tenSecondsAgo = new Date(Date.now() - 10000).toISOString();
        
        const { data: newAchievements, error } = await supabase
          .from('user_achievements_detail')
          .select('*')
          .eq('user_id', userId)
          .gte('earned_at', tenSecondsAgo)
          .order('earned_at', { ascending: false });

        if (error) {
          console.error('Error checking achievements:', error);
          return;
        }

        if (newAchievements && newAchievements.length > 0) {
          // Show celebration for each new achievement
          newAchievements.forEach((achievement: any) => {
            // Only celebrate if we haven't seen this one yet
            if (lastCheckRef.current !== achievement.earned_at) {
              console.log('🎉 New achievement found:', achievement.name);
              celebrateAchievement(achievement as Achievement);
              lastCheckRef.current = achievement.earned_at;
            }
          });
        }
      } catch (err) {
        console.error('Achievement check error:', err);
      }
    };

    // Check immediately
    checkForNewAchievements();

    // Check every 3 seconds for new achievements
    const interval = setInterval(checkForNewAchievements, 3000);

    // Also check when activities are updated
    const handleActivitiesUpdate = () => {
      console.log('📊 Activities updated, checking for new achievements...');
      setTimeout(checkForNewAchievements, 2000); // Wait 2s for DB trigger to complete
    };

    window.addEventListener('activities-updated', handleActivitiesUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('activities-updated', handleActivitiesUpdate);
    };
  }, [userId]);
};
