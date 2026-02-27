import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  Mail,
  Phone,
  Filter,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CommunicationHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["communication_logs", "all"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("communication_logs") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resendMutation = useMutation({
    mutationFn: async (log: any) => {
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        recipient_type: log.recipient_type,
        recipient_id: log.recipient_id,
        recipient_name: log.recipient_name,
        channel: log.channel,
        template_id: log.template_id,
        subject: log.subject,
        body: log.body,
        variables_used: log.variables_used,
        status: "sent",
        sent_by: userData.user?.id ?? null,
        sent_at: new Date().toISOString(),
      };

      const { error } = await (supabase.from("communication_logs") as any).insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communication_logs"] });
      toast.success("Message resent successfully");
      setDetailOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to resend message");
    },
  });

  // Apply filters
  const filteredLogs = logs.filter((log: any) => {
    if (channelFilter !== "all" && log.channel !== channelFilter) return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (dateFrom) {
      const logDate = new Date(log.created_at);
      const fromDate = new Date(dateFrom);
      if (logDate < fromDate) return false;
    }
    if (dateTo) {
      const logDate = new Date(log.created_at);
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (logDate > toDate) return false;
    }
    return true;
  });

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

  const openDetail = (log: any) => {
    setSelectedLog(log);
    setDetailOpen(true);
  };

  const clearFilters = () => {
    setChannelFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const hasActiveFilters =
    channelFilter !== "all" || statusFilter !== "all" || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Communication History</h1>
          <p className="text-muted-foreground">
            View and manage all sent communications
          </p>
        </div>
        <Button onClick={() => navigate("/communications")}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Compose
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Channel</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {filteredLogs.length} message{filteredLogs.length !== 1 ? "s" : ""}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No communications found matching your filters
            </p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log: any) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => openDetail(log)}
                    >
                      <TableCell className="font-medium">
                        {log.recipient_name || "Unknown"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {log.recipient_type}
                        </Badge>
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
                          ? format(new Date(log.sent_at), "MMM d, yyyy h:mm a")
                          : log.created_at
                          ? format(new Date(log.created_at), "MMM d, yyyy h:mm a")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {log.status === "failed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              resendMutation.mutate(log);
                            }}
                            disabled={resendMutation.isPending}
                          >
                            <Send className="h-3.5 w-3.5 mr-1" />
                            Resend
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Message Detail</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Recipient</p>
                  <p className="text-sm font-medium">
                    {selectedLog.recipient_name || "Unknown"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Recipient Type</p>
                  <p className="text-sm font-medium capitalize">
                    {selectedLog.recipient_type}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Channel</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {channelIcon(selectedLog.channel)}
                    <span className="text-sm capitalize">
                      {selectedLog.channel?.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <div className="mt-0.5">{statusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sent At</p>
                  <p className="text-sm">
                    {selectedLog.sent_at
                      ? format(new Date(selectedLog.sent_at), "MMM d, yyyy h:mm a")
                      : "-"}
                  </p>
                </div>
                {selectedLog.read_at && (
                  <div>
                    <p className="text-xs text-muted-foreground">Read At</p>
                    <p className="text-sm">
                      {format(new Date(selectedLog.read_at), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                )}
              </div>

              <div className="rounded border p-3 bg-muted/30 space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium">
                    {selectedLog.subject || "(no subject)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Body</p>
                  <pre className="text-sm whitespace-pre-wrap font-sans mt-1">
                    {selectedLog.body}
                  </pre>
                </div>
              </div>

              {selectedLog.error_message && (
                <div className="rounded border border-red-200 p-3 bg-red-50 dark:bg-red-900/10">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">Error</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {selectedLog.error_message}
                  </p>
                </div>
              )}

              {selectedLog.status === "failed" && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => resendMutation.mutate(selectedLog)}
                    disabled={resendMutation.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {resendMutation.isPending ? "Resending..." : "Resend Message"}
                  </Button>
                </div>
              )}

              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Created{" "}
                {selectedLog.created_at
                  ? format(new Date(selectedLog.created_at), "MMM d, yyyy h:mm a")
                  : "-"}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
