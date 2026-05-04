import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description: string;
  points: number;
  earned?: boolean;
  earnedAt?: string;
  size?: "sm" | "md" | "lg";
}

export default function AchievementBadge({
  icon,
  name,
  description,
  points,
  earned = false,
  earnedAt,
  size = "md",
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`${sizeClasses[size]} rounded-xl border-2 ${
            earned
              ? "bg-primary/10 border-primary shadow-lg shadow-primary/20"
              : "bg-secondary/50 border-border opacity-40 grayscale"
          } flex items-center justify-center cursor-pointer transition-all hover:scale-110 relative group`}
        >
          <span className="select-none">{icon}</span>
          {earned && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-success rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <div className="space-y-1">
          <p className="font-bold">{name}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center justify-between pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              {points} points
            </Badge>
            {earned && earnedAt && (
              <span className="text-xs text-muted-foreground">
                {new Date(earnedAt).toLocaleDateString()}
              </span>
            )}
          </div>
          {!earned && (
            <p className="text-xs text-muted-foreground italic pt-1">
              Not yet earned
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
