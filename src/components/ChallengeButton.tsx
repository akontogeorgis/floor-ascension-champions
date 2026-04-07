import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Swords } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ChallengeButtonProps {
  athleteName: string;
  athleteEmail?: string;
  athleteBestTime: string;
  yourName?: string;
  yourBestTime?: string;
}

export default function ChallengeButton({
  athleteName,
  athleteEmail,
  athleteBestTime,
  yourName,
  yourBestTime,
}: ChallengeButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChallenge = () => {
    if (!athleteEmail) {
      toast.error("Email not available for this athlete");
      return;
    }
    setShowConfirm(true);
  };

  const sendChallenge = () => {
    setSending(true);

    const challenger = yourName || "A colleague";
    const subject = encodeURIComponent(`🏃 Floor Ascension Challenge from ${challenger}!`);
    
    const body = encodeURIComponent(
      `Hey ${athleteName}!\n\n` +
      `${challenger} has challenged you to a Floor Ascension competition! 🔥\n\n` +
      `Current Stats:\n` +
      `${yourName ? `${yourName}: ${yourBestTime || 'No time yet'}` : 'Your challenger has a time set'}\n` +
      `${athleteName}: ${athleteBestTime}\n\n` +
      `Think you can beat them? Let's see what you've got! 💪\n\n` +
      `Get climbing and show them your best time!\n\n` +
      `May the fastest climber win! 🏆`
    );

    // Open default email client
    window.location.href = `mailto:${athleteEmail}?subject=${subject}&body=${body}`;
    
    setSending(false);
    setShowConfirm(false);
    toast.success(`Challenge sent to ${athleteName}!`);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleChallenge}
        className="gap-1"
        title={`Challenge ${athleteName}`}
      >
        <Swords className="w-4 h-4" />
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Challenge {athleteName}?</DialogTitle>
            <DialogDescription>
              Send a friendly challenge email to compete in the Floor Ascension!
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2 text-sm">
              <p className="font-semibold">Current Times:</p>
              {yourName && yourBestTime && (
                <p className="text-muted-foreground">
                  You: <span className="font-mono font-bold text-foreground">{yourBestTime}</span>
                </p>
              )}
              <p className="text-muted-foreground">
                {athleteName}: <span className="font-mono font-bold text-foreground">{athleteBestTime}</span>
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                This will open your email client with a pre-written challenge message.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={sending}>
              Cancel
            </Button>
            <Button onClick={sendChallenge} disabled={sending}>
              <Swords className="w-4 h-4 mr-2" />
              {sending ? "Sending..." : "Send Challenge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
