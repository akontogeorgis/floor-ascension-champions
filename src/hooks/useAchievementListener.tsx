import { useEffect } from 'react';
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
}

// Celebration effects for different categories
const celebrateAchievement = (achievement: Achievement) => {
  const { name, icon, points, category } = achievement;

  // Different celebrations based on category
  switch (category) {
    case 'milestone':
      // Confetti for milestones
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      break;
    
    case 'performance':
      // Speed burst for performance
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
    
    case 'consistency':
      // Flame effect for consistency
      confetti({
        particleCount: 30,
        spread: 40,
        origin: { y: 0.8 },
        colors: ['#FF6B35', '#FF4500', '#FFD700']
      });
      break;
    
    case 'improvement':
      // Upward celebration for improvement
      confetti({
        particleCount: 80,
        angle: 90,
        spread: 45,
        origin: { y: 1 },
        colors: ['#4CAF50', '#8BC34A']
      });
      break;
    
    case 'social':
      // Team celebration
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#9C27B0', '#E91E63', '#FF9800']
      });
      break;
  }

  // Show toast notification
  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="font-bold">Achievement Unlocked!</div>
        <div className="text-sm">{name}</div>
        <div className="text-xs text-muted-foreground">+{points} points</div>
      </div>
    </div>,
    {
      duration: 5000,
      style: {
        background: 'linear-gradient(135deg, hsl(330, 100%, 50%), hsl(300, 80%, 55%))',
        color: 'white',
        border: 'none',
      },
    }
  );
};

export const useAchievementListener = (userId: string | null) => {
  useEffect(() => {
    if (!supabase || !userId) return;

    // Subscribe to new achievements for this user
    const channel = supabase
      .channel(`user-achievements-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${userId}`,
        },
        async (payload) => {
          console.log('New achievement unlocked!', payload);
          
          // Fetch achievement details
          const { data: achievement } = await supabase
            .from('achievements')
            .select('*')
            .eq('id', payload.new.achievement_id)
            .single();

          if (achievement) {
            celebrateAchievement(achievement as Achievement);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};
