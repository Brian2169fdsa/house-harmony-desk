import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const CHANNELS  = ["in_app", "email", "sms"] as const;
const CATEGORIES = [
  { key: "payments",    label: "Payments",    desc: "Payment due, overdue, and receipt notifications" },
  { key: "maintenance", label: "Maintenance", desc: "New requests, SLA warnings, and completions" },
  { key: "compliance",  label: "Compliance",  desc: "Drug test schedules, checklist reminders" },
  { key: "intake",      label: "Intake",      desc: "New leads, application updates, move-in alerts" },
  { key: "general",     label: "General",     desc: "House announcements and system notifications" },
] as const;

const CHANNEL_LABELS: Record<string, string> = { in_app: "In-App", email: "Email", sms: "SMS" };

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  const { data: prefs = [], isLoading } = useQuery({
    queryKey: ["notification_preferences", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  const getPref = (channel: string, category: string) => {
    const p = prefs.find((p: any) => p.channel === channel && p.category === category);
    return p ? p.enabled : true; // default on
  };

  const toggle = useMutation({
    mutationFn: async ({ channel, category, enabled }: { channel: string; category: string; enabled: boolean }) => {
      if (!userId) return;
      const { error } = await supabase
        .from("notification_preferences")
        .upsert({ user_id: userId, channel, category, enabled }, { onConflict: "user_id,channel,category" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notification_preferences", userId] });
      toast.success("Preference saved");
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notification Settings</h1>
        <p className="text-muted-foreground">Choose which notifications you receive and how</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>
            Toggle which notification categories you receive on each channel.
            SMS and email require integration setup in Settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 pr-6 font-medium w-64">Category</th>
                    {CHANNELS.map((ch) => (
                      <th key={ch} className="text-center py-3 px-6 font-medium">
                        {CHANNEL_LABELS[ch]}
                        {ch !== "in_app" && (
                          <Badge variant="outline" className="ml-1 text-[10px]">Integration</Badge>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CATEGORIES.map((cat) => (
                    <tr key={cat.key} className="border-b hover:bg-muted/30">
                      <td className="py-4 pr-6">
                        <p className="font-medium">{cat.label}</p>
                        <p className="text-xs text-muted-foreground">{cat.desc}</p>
                      </td>
                      {CHANNELS.map((ch) => (
                        <td key={ch} className="text-center py-4 px-6">
                          <Switch
                            checked={getPref(ch, cat.key)}
                            onCheckedChange={(enabled) =>
                              toggle.mutate({ channel: ch, category: cat.key, enabled })
                            }
                            disabled={!userId || toggle.isPending}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channel Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">In-App Notifications</p>
              <p className="text-xs text-muted-foreground">Shown in the bell icon in the top nav</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-xs text-muted-foreground">Requires SendGrid API key in Settings</p>
            </div>
            <Badge variant="secondary">Integration Required</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-xs text-muted-foreground">Requires Twilio account ID and auth token</p>
            </div>
            <Badge variant="secondary">Integration Required</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
