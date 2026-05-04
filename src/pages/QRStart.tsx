import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { PlayCircle, Loader2, UserPlus } from "lucide-react";

const PRESET_DEPARTMENTS = [
  "Senior Troublemakers",
  "0100101101",
  "Orchestrators",
  "Digital Alchemists",
  "Uncategorized",
];

export default function QRStart() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [customDepartment, setCustomDepartment] = useState("");
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [startFloor, setStartFloor] = useState("0");
  const [loading, setLoading] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    // Check if user already has active session in localStorage
    const activeSession = localStorage.getItem('qr_session');
    if (activeSession) {
      const session = JSON.parse(activeSession);
      toast.error("You already have an active session!", {
        description: `Started from floor ${session.start_floor}. Please finish it first.`
      });
    }
  }, []);

  const checkUserExists = async () => {
    if (!email.trim()) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, department')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (profile) {
        setName(profile.name || "");
        setDepartment(profile.department || "");
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
        setName("");
        setDepartment("");
      }
    } catch (error) {
      setIsNewUser(true);
    }
  };

  const handleStart = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    const finalDepartment = isCustomDept ? customDepartment.trim() : department;

    if (isNewUser && (!name.trim() || !finalDepartment)) {
      toast.error("Please enter your name and department");
      return;
    }

    setLoading(true);

    try {
      let profile;

      // Check if user exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (existingProfile) {
        profile = existingProfile;
      } else {
        // Create new user profile
        console.log('Creating new profile:', {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          department: finalDepartment
        });

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            email: email.trim().toLowerCase(),
            name: name.trim(),
            department: finalDepartment,
            // Don't set created_at manually - let DB handle it with DEFAULT
          })
          .select('id, name')
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          toast.error(`Failed to create profile: ${createError.message}`);
          return;
        }

        profile = newProfile;

        toast.success(`Welcome ${name}!`, {
          description: "Your profile has been created."
        });
      }

      // Check for existing active session in database
      const { data: existingSession } = await supabase
        .from('qr_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('completed', false)
        .single();

      if (existingSession) {
        toast.error("You already have an active session!", {
          description: `Started from floor ${existingSession.start_floor}. Please finish it first.`
        });
        return;
      }

      // Create new session
      const sessionToken = `SESSION_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = new Date().toISOString();

      const { error: sessionError } = await supabase
        .from('qr_sessions')
        .insert({
          user_id: profile.id,
          start_floor: parseInt(startFloor),
          session_token: sessionToken,
          start_time: startTime,
          completed: false
        });

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        toast.error(`Failed to create session: ${sessionError.message}`);
        return;
      }

      // Store session in localStorage for quick access
      localStorage.setItem('qr_session', JSON.stringify({
        session_token: sessionToken,
        user_id: profile.id,
        user_name: profile.name,
        start_floor: parseInt(startFloor),
        start_time: startTime
      }));

      toast.success(`Session started for ${profile.name}!`, {
        description: `Starting from floor ${startFloor}. Now climb and scan the FINISH QR code!`,
        duration: 5000
      });

      // Redirect to home or show success
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error) {
      console.error('Error starting session:', error);
      toast.error("Failed to start session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-green-50 to-background dark:from-green-950">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <PlayCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Start Your Climb! 🏃</CardTitle>
          <CardDescription>
            Enter your details to begin tracking
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Your Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={checkUserExists}
                autoFocus
              />
            </div>

            {isNewUser && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950 p-3 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      New User Detected
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      Please complete your profile below
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isNewUser && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Engineering">Engineering</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Support">Support</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="start-floor">Starting Floor *</Label>
              <Select value={startFloor} onValueChange={setStartFloor}>
                <SelectTrigger>
                  <SelectValue placeholder="Select starting floor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">Floor -1 (Basement)</SelectItem>
                  <SelectItem value="0">Floor 0 (Ground)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleStart}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4 mr-2" />
                {isNewUser ? "Create Profile & Start" : "Start Climbing Session"}
              </>
            )}
          </Button>

          <div className="rounded-lg bg-primary/5 p-4 text-sm space-y-2">
            <p className="font-semibold text-foreground">📱 Next Steps:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Click "Start Climbing Session"</li>
              <li>Climb the stairs to your target floor</li>
              <li>Scan the FINISH QR code at your destination</li>
              <li>Your time will be automatically recorded!</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
