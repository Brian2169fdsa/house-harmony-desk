import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  return userId;
}
