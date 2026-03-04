import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useResidents() {
  return useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveResidents() {
  return useQuery({
    queryKey: ["residents-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .eq("status", "Active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}
