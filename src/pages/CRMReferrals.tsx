import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "qualified", label: "Qualified" },
  { id: "declined", label: "Declined" },
  { id: "converted", label: "Converted" },
];

export default function CRMReferrals() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: referrals, isLoading } = useQuery({
    queryKey: ["crm-referrals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_referrals")
        .select("*, crm_contacts(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createIntakeLeadMutation = useMutation({
    mutationFn: async (referralId: string) => {
      const referral = referrals?.find((r) => r.id === referralId);
      if (!referral) throw new Error("Referral not found");

      const { data: lead, error: leadError } = await supabase
        .from("intake_leads")
        .insert([
          {
            name: referral.referred_person_name,
            phone: referral.referred_phone,
            email: referral.referred_email,
            referral_source: `CRM - ${referral.crm_contacts?.first_name} ${referral.crm_contacts?.last_name}`,
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      const { error: updateError } = await supabase
        .from("crm_referrals")
        .update({ intake_lead_id: lead.id })
        .eq("id", referralId);

      if (updateError) throw updateError;

      return lead;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-referrals"] });
      toast.success("Intake lead created successfully");
    },
    onError: () => {
      toast.error("Failed to create intake lead");
    },
  });

  const getReferralsByStage = (status: string) => {
    return referrals?.filter((ref) => ref.status === status) || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/crm")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to CRM
      </Button>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Referrals</h1>
        <p className="text-muted-foreground">Track referrals from contacts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {STAGES.map((stage) => {
          const stageReferrals = getReferralsByStage(stage.id);
          return (
            <div key={stage.id} className="space-y-2">
              <div className="bg-muted p-3 rounded-lg">
                <h3 className="font-semibold text-sm">{stage.label}</h3>
                <p className="text-xs text-muted-foreground">{stageReferrals.length} referrals</p>
              </div>
              <div className="space-y-2">
                {stageReferrals.map((referral) => (
                  <Card key={referral.id} className="p-3">
                    <CardHeader className="p-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        {referral.referred_person_name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 space-y-1">
                      {referral.referred_phone && (
                        <p className="text-xs text-muted-foreground">{referral.referred_phone}</p>
                      )}
                      {referral.referred_email && (
                        <p className="text-xs text-muted-foreground">{referral.referred_email}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        From: {referral.crm_contacts?.first_name}{" "}
                        {referral.crm_contacts?.last_name}
                      </p>
                      {!referral.intake_lead_id && (
                        <Button
                          size="sm"
                          className="w-full h-7 text-xs mt-2"
                          onClick={() => createIntakeLeadMutation.mutate(referral.id)}
                          disabled={createIntakeLeadMutation.isPending}
                        >
                          Create Intake Lead
                        </Button>
                      )}
                      {referral.intake_lead_id && (
                        <p className="text-xs text-green-600 mt-2">✓ Intake lead created</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
