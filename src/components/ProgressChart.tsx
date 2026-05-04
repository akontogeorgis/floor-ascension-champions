import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import { supabase } from "@/lib/supabase";
import { Calendar, TrendingDown } from "lucide-react";

interface ActivityData {
  date: string;
  time: number;
  count: number;
}

export default function ProgressChart() {
  const [timeData30, setTimeData30] = useState<ActivityData[]>([]);
  const [timeData90, setTimeData90] = useState<ActivityData[]>([]);
  const [frequencyData, setFrequencyData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    const athleteId = localStorage.getItem('strava_athlete_id');
    if (!athleteId) return;

    try {
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('strava_athlete_id', parseInt(athleteId))
        .single();

      if (!profile) return;

      // Fetch activities from last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: activities } = await supabase
        .from('activities')
        .select('start_time, duration_seconds')
        .eq('user_id', profile.id)
        .eq('verified', true)
        .gte('start_time', ninetyDaysAgo.toISOString())
        .order('start_time', { ascending: true });

      if (!activities) {
        setLoading(false);
        return;
      }

      // Process data for 30-day chart
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const last30Days = activities.filter(a => 
        new Date(a.start_time) >= thirtyDaysAgo
      );

      // Group by date and get average time per day
      const timeMap30 = new Map<string, { total: number, count: number }>();
      last30Days.forEach(activity => {
        const date = new Date(activity.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = timeMap30.get(date) || { total: 0, count: 0 };
        timeMap30.set(date, {
          total: existing.total + activity.duration_seconds,
          count: existing.count + 1
        });
      });

      const processed30 = Array.from(timeMap30.entries()).map(([date, data]) => ({
        date,
        time: Math.round(data.total / data.count),
        count: data.count
      }));

      // Process data for 90-day chart (weekly averages)
      const weekMap = new Map<string, { total: number, count: number }>();
      activities.forEach(activity => {
        const activityDate = new Date(activity.start_time);
        const weekStart = new Date(activityDate);
        weekStart.setDate(activityDate.getDate() - activityDate.getDay());
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        const existing = weekMap.get(weekLabel) || { total: 0, count: 0 };
        weekMap.set(weekLabel, {
          total: existing.total + activity.duration_seconds,
          count: existing.count + 1
        });
      });

      const processed90 = Array.from(weekMap.entries()).map(([date, data]) => ({
        date,
        time: Math.round(data.total / data.count),
        count: data.count
      }));

      // Frequency data - climbs per week for last 12 weeks
      const frequencyMap = new Map<string, number>();
      const twelveWeeksAgo = new Date();
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

      activities.filter(a => new Date(a.start_time) >= twelveWeeksAgo).forEach(activity => {
        const activityDate = new Date(activity.start_time);
        const weekStart = new Date(activityDate);
        weekStart.setDate(activityDate.getDate() - activityDate.getDay());
        const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        frequencyMap.set(weekLabel, (frequencyMap.get(weekLabel) || 0) + 1);
      });

      const processedFrequency = Array.from(frequencyMap.entries()).map(([date, count]) => ({
        date,
        time: 0,
        count
      }));

      setTimeData30(processed30);
      setTimeData90(processed90);
      setFrequencyData(processedFrequency);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-primary">
            Time: {formatTime(payload[0].value)}
          </p>
          {payload[0].payload.count > 1 && (
            <p className="text-xs text-muted-foreground">
              {payload[0].payload.count} climbs (average)
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const FrequencyTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-primary">
            {payload[0].value} climb{payload[0].value !== 1 ? 's' : ''}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Progress Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading charts...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (timeData30.length === 0 && timeData90.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5" />
            Progress Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            No activity data available for charts
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="w-5 h-5" />
          Progress Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="30days" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="30days">30 Days</TabsTrigger>
            <TabsTrigger value="90days">90 Days</TabsTrigger>
            <TabsTrigger value="frequency">Activity Frequency</TabsTrigger>
          </TabsList>

          <TabsContent value="30days" className="mt-6">
            {timeData30.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Average time per climb over the last 30 days
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeData30}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tickFormatter={formatTime}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data for last 30 days
              </div>
            )}
          </TabsContent>

          <TabsContent value="90days" className="mt-6">
            {timeData90.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Weekly average times over the last 90 days
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeData90}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      tickFormatter={formatTime}
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="time" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No data for last 90 days
              </div>
            )}
          </TabsContent>

          <TabsContent value="frequency" className="mt-6">
            {frequencyData.length > 0 ? (
              <>
                <div className="mb-4 text-sm text-muted-foreground">
                  Number of climbs per week (last 12 weeks)
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={frequencyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      style={{ fontSize: '12px' }}
                      allowDecimals={false}
                    />
                    <Tooltip content={<FrequencyTooltip />} />
                    <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                No frequency data available
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
