import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  ScrollText,
  Search,
  Clock,
  User,
  FileText,
  ArrowRight,
  Filter,
  Activity,
  Database,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import type { Json } from "@/integrations/supabase/types";
import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface AuditEntry {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Json | null;
  new_value: Json | null;
  ip_address: string | null;
  created_at: string;
}

const ENTITY_COLORS: Record<string, string> = {
  resident: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  payment: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  incident: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  maintenance: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  checklist: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  drug_test: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  emergency: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  document: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  house: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  meeting: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  settings: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  updated: "Updated",
  deleted: "Deleted",
  status_changed: "Status Changed",
  payment_recorded: "Payment Recorded",
  incident_filed: "Incident Filed",
  test_recorded: "Test Recorded",
  meeting_logged: "Meeting Logged",
  document_generated: "Document Generated",
  checklist_completed: "Checklist Completed",
  emergency_logged: "Emergency Logged",
};

function formatJsonDiff(oldVal: Json | null, newVal: Json | null): { changes: { field: string; from: string; to: string }[] } {
  const changes: { field: string; from: string; to: string }[] = [];
  if (!oldVal && !newVal) return { changes };

  const oldObj = (typeof oldVal === "object" && oldVal !== null && !Array.isArray(oldVal)) ? oldVal as Record<string, unknown> : {};
  const newObj = (typeof newVal === "object" && newVal !== null && !Array.isArray(newVal)) ? newVal as Record<string, unknown> : {};

  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  allKeys.forEach((key) => {
    const oldStr = oldObj[key] !== undefined ? String(oldObj[key]) : "";
    const newStr = newObj[key] !== undefined ? String(newObj[key]) : "";
    if (oldStr !== newStr) {
      changes.push({ field: key, from: oldStr, to: newStr });
    }
  });

  return { changes };
}

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEntity, setFilterEntity] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  const [filterDays, setFilterDays] = useState("30");
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null);

  const { data: auditEntries = [], isLoading } = useQuery({
    queryKey: ["audit_log", filterDays],
    queryFn: async () => {
      const since = subDays(new Date(), parseInt(filterDays)).toISOString();
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as AuditEntry[];
    },
  });

  const entityTypes = useMemo(() => {
    const types = new Set(auditEntries.map((e) => e.entity_type));
    return Array.from(types).sort();
  }, [auditEntries]);

  const actionTypes = useMemo(() => {
    const actions = new Set(auditEntries.map((e) => e.action));
    return Array.from(actions).sort();
  }, [auditEntries]);

  const filtered = useMemo(() => {
    return auditEntries.filter((entry) => {
      const entityMatch = filterEntity === "all" || entry.entity_type === filterEntity;
      const actionMatch = filterAction === "all" || entry.action === filterAction;
      const searchMatch =
        !searchQuery ||
        entry.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.entity_id ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(entry.new_value ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      return entityMatch && actionMatch && searchMatch;
    });
  }, [auditEntries, filterEntity, filterAction, searchQuery]);

  const { paginatedItems, pagination } = usePagination(filtered, 25);

  const todayCount = auditEntries.filter(
    (e) => format(new Date(e.created_at), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  ).length;

  const uniqueUsers = new Set(auditEntries.map((e) => e.user_id).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ScrollText className="h-8 w-8" />
            Audit Trail
          </h1>
          <p className="text-muted-foreground">
            Complete log of all system actions with user, timestamp, and change details
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{auditEntries.length}</p>
                <p className="text-sm text-muted-foreground">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{uniqueUsers}</p>
                <p className="text-sm text-muted-foreground">Active Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{entityTypes.length}</p>
                <p className="text-sm text-muted-foreground">Entity Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search actions, entities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterEntity} onValueChange={setFilterEntity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entityTypes.map((t) => (
              <SelectItem key={t} value={t}>
                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>
                {ACTION_LABELS[a] ?? a.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterDays} onValueChange={setFilterDays}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 Hours</SelectItem>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="90">Last 90 Days</SelectItem>
            <SelectItem value="365">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">
          {filtered.length} results
        </Badge>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading audit trail...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No audit entries found</p>
              <p className="text-muted-foreground">
                System actions will be logged here automatically.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((entry) => {
                  const newObj =
                    typeof entry.new_value === "object" && entry.new_value !== null
                      ? (entry.new_value as Record<string, unknown>)
                      : {};
                  const summary =
                    (newObj.title as string) ||
                    (newObj.name as string) ||
                    (newObj.description as string) ||
                    (newObj.status as string) ||
                    "";

                  return (
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedEntry(entry)}
                    >
                      <TableCell className="text-sm">
                        <div>{format(new Date(entry.created_at), "MMM d, HH:mm")}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {ACTION_LABELS[entry.action] ?? entry.action.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            ENTITY_COLORS[entry.entity_type] ?? "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {entry.entity_type.replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {summary || (entry.entity_id ? `ID: ${entry.entity_id.substring(0, 8)}...` : "—")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <PaginationControls pagination={pagination} />
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      {selectedEntry && (
        <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Audit Entry Detail
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">
                    {format(new Date(selectedEntry.created_at), "MMM d, yyyy 'at' h:mm:ss a")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <Badge variant="outline">
                    {ACTION_LABELS[selectedEntry.action] ?? selectedEntry.action}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity Type</p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      ENTITY_COLORS[selectedEntry.entity_type] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedEntry.entity_type.replace(/_/g, " ")}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground">Entity ID</p>
                  <p className="font-mono text-xs">{selectedEntry.entity_id ?? "—"}</p>
                </div>
                {selectedEntry.user_id && (
                  <div>
                    <p className="text-muted-foreground">User ID</p>
                    <p className="font-mono text-xs">{selectedEntry.user_id}</p>
                  </div>
                )}
                {selectedEntry.ip_address && (
                  <div>
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-mono text-xs">{selectedEntry.ip_address}</p>
                  </div>
                )}
              </div>

              {/* Diff View */}
              {(selectedEntry.old_value || selectedEntry.new_value) && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Changes</p>
                  {(() => {
                    const { changes } = formatJsonDiff(selectedEntry.old_value, selectedEntry.new_value);
                    if (changes.length === 0) {
                      return (
                        <div className="bg-muted/50 rounded p-3 text-xs font-mono overflow-auto max-h-48">
                          {selectedEntry.new_value
                            ? JSON.stringify(selectedEntry.new_value, null, 2)
                            : "No data"}
                        </div>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        {changes.map((change, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm bg-muted/30 rounded p-2">
                            <span className="font-medium text-muted-foreground min-w-[80px]">
                              {change.field}
                            </span>
                            {change.from && (
                              <>
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded text-xs line-through">
                                  {change.from.substring(0, 50)}
                                </span>
                                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              </>
                            )}
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded text-xs">
                              {change.to.substring(0, 50)}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
