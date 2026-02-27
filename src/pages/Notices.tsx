import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type NoticeType = "rent_notice" | "violation" | "lease_termination" | "general";
type ServeMethod = "in_person" | "email" | "posted";
type NoticeStatus = "draft" | "served" | "acknowledged" | "expired";

interface Notice {
  id: string;
  resident_id: string | null;
  house_id: string | null;
  type: NoticeType;
  subject: string;
  body: string | null;
  served_date: string | null;
  serve_method: ServeMethod | null;
  response_deadline: string | null;
  status: NoticeStatus;
  created_at: string;
  updated_at: string;
  residents?: { name: string } | null;
}

function noticeTypeLabel(type: NoticeType): string {
  switch (type) {
    case "rent_notice": return "Rent Notice";
    case "violation": return "Violation";
    case "lease_termination": return "Lease Termination";
    case "general": return "General";
  }
}

function serveMethodLabel(method: ServeMethod | null): string {
  if (!method) return "—";
  switch (method) {
    case "in_person": return "In Person";
    case "email": return "Email";
    case "posted": return "Posted";
  }
}

function statusVariant(status: NoticeStatus) {
  switch (status) {
    case "served": return "default" as const;
    case "acknowledged": return "default" as const;
    case "expired": return "destructive" as const;
    default: return "secondary" as const;
  }
}

export default function Notices() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    resident_id: "",
    type: "general" as NoticeType,
    subject: "",
    body: "",
    served_date: "",
    serve_method: "" as ServeMethod | "",
    response_deadline: "",
    status: "draft" as NoticeStatus,
  });

  // Fetch notices with resident info
  const { data: notices = [], isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*, residents(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Notice[];
    },
  });

  // Fetch residents for dropdown
  const { data: residents = [] } = useQuery({
    queryKey: ["residents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Create notice mutation
  const createNotice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notices").insert({
        resident_id: form.resident_id || null,
        type: form.type,
        subject: form.subject,
        body: form.body || null,
        served_date: form.served_date || null,
        serve_method: (form.serve_method as ServeMethod) || null,
        response_deadline: form.response_deadline || null,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      setShowCreateDialog(false);
      setForm({
        resident_id: "",
        type: "general",
        subject: "",
        body: "",
        served_date: "",
        serve_method: "",
        response_deadline: "",
        status: "draft",
      });
      toast({ title: "Notice created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating notice", description: err.message, variant: "destructive" });
    },
  });

  const activeNotices = notices.filter((n) => n.status === "served" || n.status === "draft").length;
  const servedNotices = notices.filter((n) => n.status === "served" || n.status === "acknowledged").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notices</h1>
          <p className="text-muted-foreground">
            Generate and track formal resident notices
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Notice
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notices.length}</div>
            <p className="text-xs text-muted-foreground">{activeNotices} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Served</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{servedNotices}</div>
            <p className="text-xs text-muted-foreground">Served or acknowledged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notices.filter((n) => n.status === "draft").length}
            </div>
            <p className="text-xs text-muted-foreground">Pending service</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notice History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading notices...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Resident</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Served Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No notices yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  notices.map((notice) => (
                    <TableRow key={notice.id}>
                      <TableCell className="font-medium">
                        {noticeTypeLabel(notice.type)}
                      </TableCell>
                      <TableCell>{notice.residents?.name ?? "—"}</TableCell>
                      <TableCell>{notice.subject}</TableCell>
                      <TableCell>{notice.served_date ?? "—"}</TableCell>
                      <TableCell>{serveMethodLabel(notice.serve_method)}</TableCell>
                      <TableCell>{notice.response_deadline ?? "—"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(notice.status)}>
                          {notice.status.charAt(0).toUpperCase() + notice.status.slice(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Notice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Notice Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v as NoticeType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rent_notice">Rent Notice</SelectItem>
                    <SelectItem value="violation">Violation</SelectItem>
                    <SelectItem value="lease_termination">Lease Termination</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Resident</Label>
                <Select
                  value={form.resident_id}
                  onValueChange={(v) => setForm({ ...form, resident_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {residents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input
                placeholder="Notice subject line"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <Textarea
                placeholder="Notice body text..."
                rows={4}
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Served Date</Label>
                <Input
                  type="date"
                  value={form.served_date}
                  onChange={(e) => setForm({ ...form, served_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Serve Method</Label>
                <Select
                  value={form.serve_method}
                  onValueChange={(v) => setForm({ ...form, serve_method: v as ServeMethod })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Response Deadline</Label>
                <Input
                  type="date"
                  value={form.response_deadline}
                  onChange={(e) => setForm({ ...form, response_deadline: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as NoticeStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="served">Served</SelectItem>
                    <SelectItem value="acknowledged">Acknowledged</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createNotice.mutate()}
              disabled={createNotice.isPending || !form.subject}
            >
              {createNotice.isPending ? "Creating..." : "Create Notice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
