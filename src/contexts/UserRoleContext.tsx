import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StaffRole = "owner" | "regional_manager" | "house_manager" | "staff" | "investor";

export interface StaffProfile {
  id: string;
  user_id: string;
  role: StaffRole;
  full_name: string;
  phone: string | null;
  hire_date: string | null;
  status: string;
  house_id: string | null;
}

interface UserRoleContextValue {
  profile: StaffProfile | null;
  role: StaffRole | null;
  loading: boolean;
  isOwner: boolean;
  isManager: boolean; // owner or regional_manager or house_manager
  canEdit: boolean;   // everything except investor
  refetch: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextValue>({
  profile: null,
  role: null,
  loading: true,
  isOwner: false,
  isManager: false,
  canEdit: false,
  refetch: async () => {},
});

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("staff_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    setProfile(data as StaffProfile | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const role = profile?.role ?? null;
  const isOwner = role === "owner";
  const isManager = ["owner", "regional_manager", "house_manager"].includes(role ?? "");
  const canEdit = role !== "investor" && role !== null;

  return (
    <UserRoleContext.Provider
      value={{ profile, role, loading, isOwner, isManager, canEdit, refetch: fetchProfile }}
    >
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(UserRoleContext);
}
