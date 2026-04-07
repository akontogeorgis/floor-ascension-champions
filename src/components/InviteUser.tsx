import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
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

interface InviteUserProps {
  yourName?: string;
  yourBestTime?: string;
  yourRank?: number;
}

export default function InviteUser({ yourName, yourBestTime, yourRank }: InviteUserProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);

  const handleInvite = () => {
    if (!email.trim()) {
      toast.error("Please enter an email address");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSending(true);

    const inviter = yourName || "A colleague";
    const subject = encodeURIComponent(`🏃 Join the Floor Ascension Challenge!`);
    const recipientName = name.trim() || "there";
    
    const body = encodeURIComponent(
      `Hey ${recipientName}!\n\n` +
      `${inviter} has invited you to join the Floor Ascension Challenge! 🏆\n\n` +
      `We're competing to see who can climb the office stairs the fastest. ` +
      `It's a fun way to stay active and compete with colleagues!\n\n` +
      (yourRank ? `${inviter} is currently ranked #${yourRank}${yourBestTime ? ` with a time of ${yourBestTime}` : ''}.\n\n` : '') +
      `How to Join:\n` +
      `1. Connect your Strava, Garmin, or Apple Watch\n` +
      `2. Record your stair climb (aim for about 7 floors / ~25m elevation)\n` +
      `3. Sync your activity and see where you rank!\n\n` +
      `Ready to compete? Visit the app and connect your device to get started.\n\n` +
      `App URL: ${window.location.origin}\n\n` +
      `Let's see what you've got! 💪\n\n` +
      `May the fastest climber win! 🔥`
    );

    // Open default email client
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    
    setSending(false);
    setOpen(false);
    setEmail("");
    setName("");
    toast.success(`Invitation sent to ${email}!`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Invite New User
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Someone to Join</DialogTitle>
          <DialogDescription>
            Send an invitation email to challenge a new competitor!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-name">Their Name (optional)</Label>
            <Input
              id="invite-name"
              placeholder="e.g., John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">
              Email Address <span className="text-destructive">*</span>
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2 text-sm">
            <p className="font-semibold">They'll receive:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Welcome message with your invitation</li>
              <li>Instructions on how to join</li>
              <li>Link to the app</li>
              {yourRank && <li>Your current ranking to motivate them!</li>}
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              This will open your email client with a pre-written invitation message.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              setOpen(false);
              setEmail("");
              setName("");
            }} 
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleInvite} disabled={sending}>
            <UserPlus className="w-4 h-4 mr-2" />
            {sending ? "Sending..." : "Send Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
