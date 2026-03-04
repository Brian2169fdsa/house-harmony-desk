import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHouses() {
  return useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("id, name, address")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
