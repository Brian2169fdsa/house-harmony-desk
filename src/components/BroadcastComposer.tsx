import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Send, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type AudienceType =
  | "all_residents"
  | "house_residents"
  | "all_staff"
  | "all_vendors"
  | "all_investors";

interface BroadcastComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BroadcastComposer({ open, onOpenChange }: BroadcastComposerProps) {
  const queryClient = useQueryClient();
  const [audience, setAudience] = useState<AudienceType>("all_residents");
  const [houseId, setHouseId] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["message_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status")
        .eq("status", "Active")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, status")
        .eq("status", "active")
        .order("full_name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("id, name, active")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const getRecipients = (): { id: string; name: string; type: string }[] => {
    switch (audience) {
      case "all_residents":
        return residents.map((r: any) => ({ id: r.id, name: r.name, type: "resident" }));
      case "house_residents":
        return residents
          .filter((_r: any) => houseId)
          .map((r: any) => ({ id: r.id, name: r.name, type: "resident" }));
      case "all_staff":
        return staffProfiles.map((s: any) => ({ id: s.id, name: s.full_name, type: "staff" }));
      case "all_vendors":
        return vendors.map((v: any) => ({ id: v.id, name: v.name, type: "vendor" }));
      case "all_investors":
        return [];
      default:
        return [];
    }
  };

  const recipientCount = getRecipients().length;

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t: any) => t.id === id);
    if (template) {
      setSubject((template as any).subject_template || "");
      setBody((template as any).body_template || "");
    }
  };

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const recipients = getRecipients();
      if (recipients.length === 0) {
        throw new Error("No recipients found for selected audience");
      }

      const { data: userData } = await supabase.auth.getUser();

      const logs = recipients.map((r) => ({
        recipient_type: r.type,
        recipient_id: r.id,
        recipient_name: r.name,
        channel,
        template_id: templateId || null,
        subject,
        body,
        status: "sent" as const,
        sent_by: userData.user?.id ?? null,
        sent_at: new Date().toISOString(),
      }));

      const { error } = await (supabase.from("communication_logs") as any).insert(logs);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication_logs"] });
      toast.success(`Broadcast sent to ${recipientCount} recipients`);
      resetForm();
      setConfirmOpen(false);
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send broadcast");
    },
  });

  const resetForm = () => {
    setAudience("all_residents");
    setHouseId("");
    setChannel("in_app");
    setTemplateId("");
    setSubject("");
    setBody("");
  };

  const handleSend = () => {
    if (!subject.trim() || !body.trim()) {
      toast.error("Subject and body are required");
      return;
    }
    setConfirmOpen(true);
  };

  const audienceLabel = (a: AudienceType): string => {
    const labels: Record<AudienceType, string> = {
      all_residents: "All Residents",
      house_residents: "Residents in Specific House",
      all_staff: "All Staff",
      all_vendors: "All Vendors",
      all_investors: "All Investors",
    };
    return labels[a];
  };

  const sampleMessage = body
    .replace(/\{\{resident_name\}\}/g, "John Doe")
    .replace(/\{\{house_name\}\}/g, "Harmony House")
    .replace(/\{\{facility_name\}\}/g, "SoberOps Living")
    .replace(/\{\{manager_name\}\}/g, "Jane Manager")
    .replace(/\{\{balance_due\}\}/g, "$450.00")
    .replace(/\{\{due_date\}\}/g, "03/15/2026")
    .replace(/\{\{phone_number\}\}/g, "(555) 123-4567")
    .replace(/\{\{\w+\}\}/g, "[value]");

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Broadcast Message
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select
                value={audience}
                onValueChange={(v) => setAudience(v as AudienceType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_residents">All Residents</SelectItem>
                  <SelectItem value="house_residents">Residents in Specific House</SelectItem>
                  <SelectItem value="all_staff">All Staff</SelectItem>
                  <SelectItem value="all_vendors">All Vendors</SelectItem>
                  <SelectItem value="all_investors">All Investors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {audience === "house_residents" && (
              <div className="space-y-2">
                <Label>Select House</Label>
                <Select value={houseId} onValueChange={setHouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a house" />
                  </SelectTrigger>
                  <SelectContent>
                    {houses.map((h: any) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template (optional)</Label>
              <Select value={templateId} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
              />
            </div>

            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message body..."
              />
            </div>

            {body.trim() && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Preview (sample)</p>
                    <Badge variant="outline">{recipientCount} recipient(s)</Badge>
                  </div>
                  <p className="text-sm font-medium">{subject}</p>
                  <pre className="text-sm whitespace-pre-wrap font-sans text-muted-foreground">
                    {sampleMessage}
                  </pre>
                </CardContent>
              </Card>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={!subject.trim() || !body.trim() || recipientCount === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Broadcast
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Confirm Broadcast
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <p className="text-sm">
              You are about to send a broadcast message to{" "}
              <span className="font-bold">{recipientCount}</span> recipient(s).
            </p>
            <div className="rounded border p-3 bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground">Audience</p>
              <p className="text-sm font-medium">{audienceLabel(audience)}</p>
              <p className="text-xs text-muted-foreground mt-2">Channel</p>
              <p className="text-sm font-medium capitalize">{channel.replace("_", " ")}</p>
              <p className="text-xs text-muted-foreground mt-2">Subject</p>
              <p className="text-sm font-medium">{subject}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. Are you sure?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => broadcastMutation.mutate()}
              disabled={broadcastMutation.isPending}
            >
              {broadcastMutation.isPending ? "Sending..." : "Confirm & Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
