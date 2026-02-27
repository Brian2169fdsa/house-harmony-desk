import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Send,
  Clock,
  Mail,
  Phone,
  Users,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { BroadcastComposer } from "@/components/BroadcastComposer";

type RecipientTarget =
  | "individual_resident"
  | "individual_staff"
  | "individual_vendor"
  | "broadcast_house"
  | "broadcast_all";

const SAMPLE_DATA: Record<string, string> = {
  resident_name: "John Doe",
  house_name: "Harmony House",
  balance_due: "$450.00",
  due_date: "03/15/2026",
  manager_name: "Jane Manager",
  phone_number: "(555) 123-4567",
  facility_name: "SoberOps Living",
  amount: "$500.00",
  late_fee: "$25.00",
  total_balance: "$525.00",
  meeting_date: "03/10/2026",
  meeting_time: "6:00 PM",
  location: "Main Office",
  ticket_title: "Broken Window",
  status: "In Progress",
  eta: "03/12/2026",
  notes: "Parts ordered",
  violation_type: "Curfew Violation",
  violation_count: "2",
  meeting_deadline: "03/08/2026",
  chore_name: "Kitchen Clean-up",
  subject: "Emergency Notice",
  message: "Please evacuate immediately.",
  contact_name: "Front Desk",
  contact_phone: "(555) 987-6543",
  investor_name: "Robert Investor",
  month_year: "February 2026",
  occupancy_rate: "94%",
  gross_revenue: "$42,000",
  noi: "$28,500",
  vendor_name: "ABC Plumbing",
  order_number: "WO-1024",
  service_type: "Plumbing",
  address: "123 Main St",
  priority: "High",
  requested_date: "03/05/2026",
  description: "Leaking faucet in bathroom.",
  lead_name: "Sarah Smith",
  tour_date: "03/12/2026",
  tour_time: "2:00 PM",
  staff_name: "Mike Staff",
  week_start: "03/09/2026",
  shift_details: "Mon 8am-4pm, Wed 8am-4pm, Fri 12pm-8pm",
};

export default function CommunicationCenter() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [recipientTarget, setRecipientTarget] = useState<RecipientTarget>("individual_resident");
  const [recipientId, setRecipientId] = useState("");
  const [channel, setChannel] = useState("in_app");
  const [templateId, setTemplateId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledFor, setScheduledFor] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Data queries
  const { data: residents = [] } = useQuery({
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

  const { data: staffProfiles = [] } = useQuery({
    queryKey: ["staff_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_profiles")
        .select("id, full_name, status")
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
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
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

  const { data: recentLogs = [] } = useQuery({
    queryKey: ["communication_logs", "recent"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("communication_logs") as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Resolve the recipient name from selected target and id
  const getRecipientName = (): string => {
    if (recipientTarget === "individual_resident") {
      const r = residents.find((res: any) => res.id === recipientId);
      return r ? (r as any).name : "";
    }
    if (recipientTarget === "individual_staff") {
      const s = staffProfiles.find((st: any) => st.id === recipientId);
      return s ? (s as any).full_name : "";
    }
    if (recipientTarget === "individual_vendor") {
      const v = vendors.find((ven: any) => ven.id === recipientId);
      return v ? (v as any).name : "";
    }
    if (recipientTarget === "broadcast_house") {
      const h = houses.find((ho: any) => ho.id === recipientId);
      return h ? `House: ${(h as any).name}` : "";
    }
    return "All";
  };

  const getRecipientType = (): string => {
    switch (recipientTarget) {
      case "individual_resident":
      case "broadcast_house":
      case "broadcast_all":
        return "resident";
      case "individual_staff":
        return "staff";
      case "individual_vendor":
        return "vendor";
      default:
        return "resident";
    }
  };

  const handleTemplateSelect = (id: string) => {
    setTemplateId(id);
    const template = templates.find((t: any) => t.id === id);
    if (template) {
      setSubject((template as any).subject_template || "");
      setBody((template as any).body_template || "");
    }
  };

  // Replace template variables with sample data for preview
  const replaceVariables = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return SAMPLE_DATA[key] || `[${key}]`;
    });
  };

  // Highlight variable placeholders in template text
  const highlightVariables = (text: string): React.ReactNode[] => {
    const parts = text.split(/(\{\{\w+\}\})/g);
    return parts.map((part, i) => {
      if (/^\{\{\w+\}\}$/.test(part)) {
        return (
          <span key={i} className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-1 rounded font-mono text-xs">
            {part}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Send now mutation
  const sendMutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const recipientName = getRecipientName();

      if (scheduleLater) {
        if (!scheduledFor) throw new Error("Please select a schedule date/time");

        const payload = {
          template_id: templateId || null,
          recipient_type: getRecipientType(),
          recipient_filter_json: {
            target: recipientTarget,
            recipient_id: recipientId || null,
            subject,
            body,
            recipient_name: recipientName,
          },
          channel,
          scheduled_for: scheduledFor,
          recurrence: "once",
          status: "scheduled",
          created_by: userData.user?.id ?? null,
        };

        const { error } = await (supabase.from("scheduled_communications") as any).insert([payload]);
        if (error) throw error;
      } else {
        const payload = {
          recipient_type: getRecipientType(),
          recipient_id: recipientId || null,
          recipient_name: recipientName,
          channel,
          template_id: templateId || null,
          subject,
          body,
          status: "sent",
          sent_by: userData.user?.id ?? null,
          sent_at: new Date().toISOString(),
        };

        const { error } = await (supabase.from("communication_logs") as any).insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication_logs"] });
      toast.success(scheduleLater ? "Message scheduled successfully" : "Message sent successfully");
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    },
  });

  const resetForm = () => {
    setRecipientTarget("individual_resident");
    setRecipientId("");
    setChannel("in_app");
    setTemplateId("");
    setSubject("");
    setBody("");
    setScheduleLater(false);
    setScheduledFor("");
    setShowPreview(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) {
      toast.error("Message body is required");
      return;
    }
    if (
      (recipientTarget === "individual_resident" ||
        recipientTarget === "individual_staff" ||
        recipientTarget === "individual_vendor" ||
        recipientTarget === "broadcast_house") &&
      !recipientId
    ) {
      toast.error("Please select a recipient");
      return;
    }
    sendMutation.mutate();
  };

  const channelIcon = (ch: string) => {
    switch (ch) {
      case "email":
        return <Mail className="h-3.5 w-3.5" />;
      case "sms":
        return <Phone className="h-3.5 w-3.5" />;
      default:
        return <MessageSquare className="h-3.5 w-3.5" />;
    }
  };

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      sent: "default",
      delivered: "default",
      read: "secondary",
      failed: "destructive",
      draft: "outline",
      queued: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication Center</h1>
          <p className="text-muted-foreground">Send messages, notifications, and broadcasts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/communications/templates")}>
            Templates
          </Button>
          <Button variant="outline" onClick={() => navigate("/communications/history")}>
            History
          </Button>
          <Button onClick={() => setBroadcastOpen(true)}>
            <Users className="h-4 w-4 mr-2" />
            Broadcast
          </Button>
        </div>
      </div>

      {/* Compose Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Compose Message
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Target */}
              <div className="space-y-2">
                <Label>Recipient Type</Label>
                <Select
                  value={recipientTarget}
                  onValueChange={(v) => {
                    setRecipientTarget(v as RecipientTarget);
                    setRecipientId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual_resident">Individual Resident</SelectItem>
                    <SelectItem value="individual_staff">Individual Staff</SelectItem>
                    <SelectItem value="individual_vendor">Individual Vendor</SelectItem>
                    <SelectItem value="broadcast_house">Broadcast to House</SelectItem>
                    <SelectItem value="broadcast_all">Broadcast to All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Recipient Selector (individual or house) */}
              {recipientTarget === "individual_resident" && (
                <div className="space-y-2">
                  <Label>Resident</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a resident" />
                    </SelectTrigger>
                    <SelectContent>
                      {residents.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {recipientTarget === "individual_staff" && (
                <div className="space-y-2">
                  <Label>Staff Member</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffProfiles.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {recipientTarget === "individual_vendor" && (
                <div className="space-y-2">
                  <Label>Vendor</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {recipientTarget === "broadcast_house" && (
                <div className="space-y-2">
                  <Label>House</Label>
                  <Select value={recipientId} onValueChange={setRecipientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a house" />
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
              {recipientTarget === "broadcast_all" && (
                <div className="space-y-2">
                  <Label>Recipient</Label>
                  <div className="flex items-center h-10 px-3 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                    All Residents
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Channel */}
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_app">
                      <span className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5" /> In-App
                      </span>
                    </SelectItem>
                    <SelectItem value="email">
                      <span className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" /> Email
                      </span>
                    </SelectItem>
                    <SelectItem value="sms">
                      <span className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" /> SMS
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Selector */}
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
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
              />
              {subject && subject.includes("{{") && (
                <div className="text-sm mt-1">
                  {highlightVariables(subject)}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message body..."
              />
              {body && body.includes("{{") && (
                <div className="text-sm mt-1 p-2 rounded border bg-muted/20">
                  <p className="text-xs text-muted-foreground mb-1">Template with placeholders:</p>
                  <div className="whitespace-pre-wrap">
                    {highlightVariables(body)}
                  </div>
                </div>
              )}
            </div>

            {/* Preview with sample data */}
            {body.trim() && (
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="mb-2"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? "Hide Preview" : "Show Preview with Sample Data"}
                </Button>
                {showPreview && (
                  <Card className="bg-muted/30">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Variable Replacement Preview
                      </p>
                      {subject && (
                        <p className="text-sm font-semibold">
                          {replaceVariables(subject)}
                        </p>
                      )}
                      <pre className="text-sm whitespace-pre-wrap font-sans">
                        {replaceVariables(body)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Schedule Toggle */}
            <div className="flex items-center gap-3 pt-2 border-t">
              <Switch checked={scheduleLater} onCheckedChange={setScheduleLater} />
              <Label className="cursor-pointer" onClick={() => setScheduleLater(!scheduleLater)}>
                Schedule for later
              </Label>
              {scheduleLater && (
                <Input
                  type="datetime-local"
                  className="max-w-xs ml-4"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Clear
              </Button>
              <Button type="submit" disabled={sendMutation.isPending}>
                {sendMutation.isPending ? (
                  "Sending..."
                ) : scheduleLater ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Now
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Sent Messages */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Messages</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/communications/history")}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No messages sent yet
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentLogs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">
                        {log.recipient_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {channelIcon(log.channel)}
                          <span className="capitalize text-sm">
                            {log.channel?.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                        {log.subject || "(no subject)"}
                      </TableCell>
                      <TableCell>{statusBadge(log.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.sent_at
                          ? format(new Date(log.sent_at), "MMM d, h:mm a")
                          : log.created_at
                          ? format(new Date(log.created_at), "MMM d, h:mm a")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <BroadcastComposer open={broadcastOpen} onOpenChange={setBroadcastOpen} />
    </div>
  );
}
