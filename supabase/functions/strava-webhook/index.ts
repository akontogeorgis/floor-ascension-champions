import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// COSMOTE building coordinates (UPDATE THESE WITH ACTUAL VALUES)
const COSMOTE_BUILDING_LAT = 37.9906; // Replace with actual latitude
const COSMOTE_BUILDING_LNG = 23.7636; // Replace with actual longitude
const MAX_DISTANCE_METERS = 100; // Activity must start within 100m of building
const EXPECTED_ELEVATION = 25; // ~25 meters for 7 floors
const ELEVATION_TOLERANCE = 10; // ±10 meters tolerance

serve(async (req) => {
  try {
    // Handle Strava webhook verification (GET request)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("Webhook verification request:", { mode, token });

      // Verify the token matches what we set
      if (mode === "subscribe" && token === Deno.env.get("WEBHOOK_VERIFY_TOKEN")) {
        console.log("Webhook verified successfully");
        return new Response(JSON.stringify({ "hub.challenge": challenge }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // Handle webhook events (POST request)
    if (req.method === "POST") {
      const event = await req.json();
      console.log("Received webhook event:", event);

      // Only process new activities
      if (event.object_type === "activity" && event.aspect_type === "create") {
        const activityId = event.object_id;
        const athleteId = event.owner_id;

        console.log(`Processing new activity ${activityId} from athlete ${athleteId}`);

        // Fetch activity details from Strava API
        // Note: You'll need to store each athlete's access token in your database
        // For now, we'll use a service account token (limited functionality)
        const stravaResponse = await fetch(
          `https://www.strava.com/api/v3/activities/${activityId}`,
          {
            headers: {
              Authorization: `Bearer ${Deno.env.get("STRAVA_ACCESS_TOKEN")}`,
            },
          }
        );

        if (!stravaResponse.ok) {
          console.error("Failed to fetch activity from Strava:", await stravaResponse.text());
          return new Response(
            JSON.stringify({ error: "Failed to fetch activity" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        const activity = await stravaResponse.json();
        console.log("Activity details:", {
          id: activity.id,
          name: activity.name,
          elevation: activity.total_elevation_gain,
          distance: activity.distance,
          startLat: activity.start_latlng?.[0],
          startLng: activity.start_latlng?.[1],
        });

        // Validate activity
        const validation = validateActivity(activity);
        console.log("Validation result:", validation);

        if (validation.isValid) {
          // Store in Supabase
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );

          // TODO: Map Strava athlete ID to your user profile
          // For now, we'll create a dummy user ID or you can look up by athlete ID
          
          const { data, error } = await supabase
            .from("activities")
            .insert({
              // user_id: userId, // You need to map this
              duration_seconds: activity.elapsed_time,
              elevation_gain_meters: activity.total_elevation_gain,
              source: "strava",
              verified: true,
              is_personal_best: false, // Calculate this based on user's history
              start_time: activity.start_date,
              end_time: new Date(
                new Date(activity.start_date).getTime() +
                  activity.elapsed_time * 1000
              ).toISOString(),
              gps_start_lat: activity.start_latlng?.[0],
              gps_start_lon: activity.start_latlng?.[1],
              gps_end_lat: activity.end_latlng?.[0],
              gps_end_lon: activity.end_latlng?.[1],
            });

          if (error) {
            console.error("Error inserting activity:", error);
            return new Response(
              JSON.stringify({ error: "Failed to save activity" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          console.log("Activity saved successfully:", data);
          return new Response(
            JSON.stringify({ success: true, validated: true, saved: true }),
            { headers: { "Content-Type": "application/json" } }
          );
        } else {
          console.log("Activity rejected:", validation.reason);
          return new Response(
            JSON.stringify({
              success: true,
              validated: false,
              reason: validation.reason,
            }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      }

      // Acknowledge other events
      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

interface ValidationResult {
  isValid: boolean;
  reason?: string;
}

function validateActivity(activity: any): ValidationResult {
  // Check elevation gain (~25m for 7 floors)
  const elevationGain = activity.total_elevation_gain;

  if (elevationGain < EXPECTED_ELEVATION - ELEVATION_TOLERANCE) {
    return {
      isValid: false,
      reason: `Elevation gain too low: ${elevationGain}m (expected ~${EXPECTED_ELEVATION}m)`,
    };
  }

  if (elevationGain > EXPECTED_ELEVATION + ELEVATION_TOLERANCE) {
    return {
      isValid: false,
      reason: `Elevation gain too high: ${elevationGain}m (expected ~${EXPECTED_ELEVATION}m)`,
    };
  }

  // Check location (activity should start near COSMOTE building)
  const startLat = activity.start_latlng?.[0];
  const startLng = activity.start_latlng?.[1];

  if (!startLat || !startLng) {
    return {
      isValid: false,
      reason: "No GPS data available",
    };
  }

  const distance = calculateDistance(
    COSMOTE_BUILDING_LAT,
    COSMOTE_BUILDING_LNG,
    startLat,
    startLng
  );

  if (distance > MAX_DISTANCE_METERS) {
    return {
      isValid: false,
      reason: `Activity too far from office: ${Math.round(distance)}m away (max ${MAX_DISTANCE_METERS}m)`,
    };
  }

  // All checks passed
  return {
    isValid: true,
  };
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
