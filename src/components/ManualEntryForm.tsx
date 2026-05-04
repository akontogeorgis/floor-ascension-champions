import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ManualEntryForm() {
  const [open, setOpen] = useState(false);
  const [minutes, setMinutes] = useState("");
  const [seconds, setSeconds] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!minutes || !seconds) {
      toast.error("Please enter both minutes and seconds");
      return;
    }

    const mins = parseInt(minutes);
    const secs = parseInt(seconds);

    if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
      toast.error("Please enter valid time values");
      return;
    }

    const totalSeconds = mins * 60 + secs;

    if (totalSeconds < 30) {
      toast.error("Time seems too fast. Minimum is 30 seconds.");
      return;
    }

    if (totalSeconds > 600) {
      toast.error("Time seems too slow. Maximum is 10 minutes.");
      return;
    }

    setSubmitting(true);

    try {
      if (!supabase) {
        toast.error("Database not configured");
        return;
      }

      // Get current user's profile
      const athleteId = localStorage.getItem('strava_athlete_id');
      if (!athleteId) {
        toast.error("Please connect to Strava first to create your profile");
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) {
        toast.error("Profile not found. Please reconnect to Strava.");
        return;
      }

      // Insert manual activity
      const activityDate = new Date(date);
      const { error } = await supabase
        .from('activities')
        .insert({
          user_id: profile.id,
          duration_seconds: totalSeconds,
          source: 'manual',
          verified: true, // Auto-verify manual entries (no admin approval needed)
          created_at: activityDate.toISOString(),
          activity_date: activityDate.toISOString(),
          start_time: activityDate.toISOString(),
          end_time: new Date(activityDate.getTime() + totalSeconds * 1000).toISOString(),
          notes: notes.trim() || null,
        });

      if (error) throw error;

      toast.success("Activity logged successfully!", {
        description: "Your time has been added to the leaderboard.",
      });

      // Reset form
      setMinutes("");
      setSeconds("");
      setDate(new Date().toISOString().split('T')[0]);
      setNotes("");
      setOpen(false);

      // Trigger refresh of all components (leaderboard, stats, etc.)
      window.dispatchEvent(new Event('activities-updated'));
    } catch (error) {
      console.error('Error submitting manual activity:', error);
      toast.error("Failed to submit activity. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="w-4 h-4" />
          Log Manual Time
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Manual Activity</DialogTitle>
          <DialogDescription>
            Record your stair climb time manually. Activity will require admin verification before appearing on the leaderboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Time <span className="text-destructive">*</span></Label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="9"
                  placeholder="MM"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <span className="text-xs text-muted-foreground text-center block mt-1">Minutes</span>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="0"
                  max="59"
                  placeholder="SS"
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className="text-center text-lg font-mono"
                />
                <span className="text-xs text-muted-foreground text-center block mt-1">Seconds</span>
              </div>
            </div>
            {minutes && seconds && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Total: {minutes}:{seconds.padStart(2, '0')}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-date">Date <span className="text-destructive">*</span></Label>
            <Input
              id="activity-date"
              type="date"
              value={date}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activity-notes">Notes (optional)</Label>
            <Textarea
              id="activity-notes"
              placeholder="Any additional details about your climb..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
            />
            <span className="text-xs text-muted-foreground">
              {notes.length}/500 characters
            </span>
          </div>

          <div className="rounded-lg bg-primary/5 p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground">📋 Verification Required</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Manual entries require admin verification</li>
              <li>Provide accurate times to maintain fairness</li>
              <li>You may be asked to provide proof (photo, witness, etc.)</li>
              <li>Verified entries will appear on the leaderboard</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false);
              setMinutes("");
              setSeconds("");
              setNotes("");
            }} 
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            <Upload className="w-4 h-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Activity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
