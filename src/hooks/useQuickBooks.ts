import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type QBConnection = {
  id: string;
  user_id: string;
  realm_id: string;
  company_name: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
  sync_errors: number;
  status: string;
  expires_at: string;
};

export type QBAccountMapping = {
  id: string;
  local_category: string;
  qb_account_id: string;
  qb_account_name: string;
  qb_account_type: string | null;
  active: boolean;
};

export type QBSyncLog = {
  id: string;
  entity_type: string;
  direction: string;
  operation: string;
  status: string;
  qb_id: string | null;
  error_message: string | null;
  created_at: string;
};

export function useQuickBooks() {
  const queryClient = useQueryClient();

  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ["qb_connection"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from("qb_connections")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data as QBConnection | null;
    },
  });

  const { data: mappings = [] } = useQuery({
    queryKey: ["qb_account_mappings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("qb_account_mappings")
        .select("*")
        .eq("user_id", user.id)
        .order("local_category");
      return (data ?? []) as QBAccountMapping[];
    },
  });

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["qb_sync_log_recent"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("qb_sync_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return (data ?? []) as QBSyncLog[];
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from("qb_connections")
        .update({ status: "disconnected", is_connected: false })
        .eq("id", connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["qb_connection"] });
      toast.success("QuickBooks disconnected");
    },
    onError: () => toast.error("Failed to disconnect"),
  });

  const isConnected =
    connection?.is_connected === true || connection?.status === "active";
  const errorCount = recentLogs.filter((l) => l.status === "error").length;

  return {
    connection,
    connectionLoading,
    mappings,
    recentLogs,
    isConnected,
    errorCount,
    disconnect: (id: string) => disconnectMutation.mutate(id),
  };
}
