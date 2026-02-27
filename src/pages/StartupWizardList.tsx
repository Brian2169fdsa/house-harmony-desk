import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Rocket, Plus, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const TOTAL_STEPS = 10;

export default function StartupWizardList() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const { data: wizards = [], isLoading } = useQuery({
    queryKey: ["startup_wizards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("startup_wizards")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createWizard = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("startup_wizards")
        .insert([
          {
            user_id: userId,
            organization_name: "New Organization",
            municipality: "phoenix",
            narr_level: "II",
            current_step: 1,
            completed_steps: [],
            step_data: {},
            status: "in_progress",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (wizard) => {
      queryClient.invalidateQueries({ queryKey: ["startup_wizards"] });
      navigate(`/startup/${wizard.id}`);
    },
    onError: () => {
      toast({ title: "Failed to create wizard", variant: "destructive" });
    },
  });

  const progressPercent = (wizard: any) => {
    const completed = (wizard.completed_steps as number[]).length;
    return Math.round((completed / TOTAL_STEPS) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Rocket className="h-8 w-8" />
            Startup Wizard
          </h1>
          <p className="text-muted-foreground">
            Guided setup for launching your Arizona sober living house
          </p>
        </div>
        <Button
          onClick={() => createWizard.mutate()}
          disabled={createWizard.isPending || !userId}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Wizard
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : wizards.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
            <Rocket className="h-12 w-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">No wizard sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a new wizard to guide you through launching your sober living house
              </p>
            </div>
            <Button
              onClick={() => createWizard.mutate()}
              disabled={createWizard.isPending || !userId}
            >
              <Plus className="mr-2 h-4 w-4" />
              Start Wizard
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {(wizards as any[]).map((wizard) => {
            const pct = progressPercent(wizard);
            return (
              <Card
                key={wizard.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/startup/${wizard.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="truncate">{wizard.organization_name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {wizard.municipality.charAt(0).toUpperCase() + wizard.municipality.slice(1)},
                        AZ &nbsp;·&nbsp; NARR Level {wizard.narr_level}
                      </p>
                    </div>
                    <Badge
                      variant={wizard.status === "completed" ? "default" : "secondary"}
                      className="ml-2 shrink-0"
                    >
                      {wizard.status === "completed" ? "Complete" : `Step ${wizard.current_step}/10`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{(wizard.completed_steps as number[]).length} of 10 steps complete</span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Started {format(new Date(wizard.created_at), "MMM d, yyyy")}
                    </span>
                    <span className="flex items-center gap-1">
                      Continue <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>About this wizard:</strong> The Startup Wizard walks you through the 10
            essential steps to launch a compliant Arizona sober living house — from LLC
            formation through AzRHA certification, insurance, staffing, and referral network
            development. Your progress is saved automatically at each step.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
