
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function StravaCallback() {
  const [status, setStatus] = useState("Processing...");
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const error = params.get("error");

      if (error) {
        setStatus("Authorization failed");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      if (!code) {
        setStatus("No authorization code received");
        setTimeout(() => navigate("/"), 2000);
        return;
      }

      try {
        // Exchange code for access token
        const response = await fetch("https://www.strava.com/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
            client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
            code: code,
            grant_type: "authorization_code",
          }),
        });

        const data = await response.json();

        if (data.access_token) {
          const athlete = data.athlete;
          const athleteName = `${athlete.firstname} ${athlete.lastname}`;
          
          // Store tokens and athlete info
          localStorage.setItem("strava_access_token", data.access_token);
          localStorage.setItem("strava_refresh_token", data.refresh_token);
          localStorage.setItem("strava_athlete_name", athleteName);
          localStorage.setItem("strava_athlete_id", athlete.id.toString());

          // Auto-create or update profile in Supabase
          if (supabase) {
            try {
              // Check if profile already exists
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('strava_athlete_id', athlete.id)
                .single();

              if (existingProfile) {
                // Profile exists
                console.log('Existing profile found:', existingProfile);
                setStatus(`Welcome back, ${existingProfile.full_name}!`);
              } else {
                // Create new profile
                const initials = `${athlete.firstname[0] || ''}${athlete.lastname[0] || ''}`.toUpperCase();
                
                const { data: newProfile, error } = await supabase
                  .from('profiles')
                  .insert({
                    full_name: athleteName,
                    email: athlete.email || null,
                    avatar_initials: initials,
                    strava_athlete_id: athlete.id,
                    department: 'Uncategorized', // User can update later
                  })
                  .select()
                  .single();

                if (error) {
                  console.error('Error creating profile:', error);
                  setStatus("Connected! (Profile creation pending)");
                } else {
                  console.log('Created new profile:', newProfile);
                  setStatus(`Profile created for ${athleteName}!`);
                  toast.success(`Welcome ${athleteName}! Profile created successfully.`);
                }
              }
            } catch (error) {
              console.error('Error handling profile:', error);
              // Continue anyway - connection still works
            }
          }

          setStatus("Connected successfully!");
          
          // Trigger a custom event to refresh StravaConnect component
          window.dispatchEvent(new Event('strava-connected'));
          
          setTimeout(() => navigate("/"), 1500);
        } else {
          setStatus("Failed to get access token");
          setTimeout(() => navigate("/"), 2000);
        }
      } catch (error) {
        console.error("Error:", error);
        setStatus("Connection failed");
        setTimeout(() => navigate("/"), 2000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Connecting to Strava...</h1>
        <p className="text-muted-foreground">{status}</p>
      </div>
    </div>
  );
}