import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Bell, CheckCheck, ExternalLink } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";

const CATEGORY_COLORS: Record<string, string> = {
  payments:    "bg-blue-100 text-blue-800",
  maintenance: "bg-orange-100 text-orange-800",
  compliance:  "bg-red-100 text-red-800",
  intake:      "bg-green-100 text-green-800",
  general:     "bg-gray-100 text-gray-800",
};

export function NotificationCenter() {
  const queryClient = useQueryClient();
  const navigate    = useNavigate();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id ?? null));
  }, []);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("notification_log")
        .select("*")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n: any) => n.status !== "read").length;

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notification_log")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const { error } = await supabase
        .from("notification_log")
        .update({ status: "read", read_at: new Date().toISOString() })
        .eq("recipient_id", userId)
        .neq("status", "read");
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", userId] }),
  });

  const handleClick = (n: any) => {
    if (n.status !== "read") markRead.mutate(n.id);
    // Navigate based on category
    const routes: Record<string, string> = {
      payments:    "/payments",
      maintenance: "/maintenance",
      compliance:  "/checklists",
      intake:      "/intake",
    };
    const route = routes[n.category];
    if (route) { setOpen(false); navigate(route); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1 text-[10px] leading-5">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate()}>
                <CheckCheck className="h-3.5 w-3.5 mr-1" />Mark all read
              </Button>
            )}
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setOpen(false); navigate("/settings/notifications"); }}>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="max-h-[480px] overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n: any) => (
              <button
                key={n.id}
                className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${n.status !== "read" ? "bg-blue-50/50" : ""}`}
                onClick={() => handleClick(n)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {n.status !== "read" && (
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                    )}
                    {n.status === "read" && <div className="h-2 w-2" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[n.category] ?? CATEGORY_COLORS.general}`}>
                        {n.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                        {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
