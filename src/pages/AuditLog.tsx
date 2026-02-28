import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Shield,
  Search,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Activity,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  UserPlus,
  UserCog,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

interface AuditRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  staff_profiles?: { full_name: string } | null;
}

// ── Constants ─────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ACTION_COLORS: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 border-green-300",
  UPDATE: "bg-blue-100 text-blue-800 border-blue-300",
  DELETE: "bg-red-100 text-red-800 border-red-300",
  LOGIN: "bg-violet-100 text-violet-800 border-violet-300",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-300",
  INVITE: "bg-amber-100 text-amber-800 border-amber-300",
  ROLE_CHANGE: "bg-orange-100 text-orange-800 border-orange-300",
};

const ACTION_ICONS: Record<string, React.ElementType> = {
  INSERT: PlusCircle,
  UPDATE: Pencil,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  INVITE: UserPlus,
  ROLE_CHANGE: UserCog,
};

const ENTITY_LABELS: Record<string, string> = {
  residents: "Resident",
  incidents: "Incident",
  maintenance_requests: "Maintenance",
  drug_tests: "Drug Test",
  houses: "House",
  payments: "Payment",
  chores: "Chore",
  messages: "Message",
  notices: "Notice",
  staff_profiles: "Staff",
  accreditations: "Accreditation",
  expense_records: "Expense",
  community_engagement_log: "Community",
};

// ── Helpers ───────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function entityLabel(raw: string) {
  return (
    ENTITY_LABELS[raw] ??
    raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function diffKeys(
  oldVal: Record<string, unknown> | null,
  newVal: Record<string, unknown> | null
): string[] {
  const allKeys = new Set([
    ...Object.keys(oldVal ?? {}),
    ...Object.keys(newVal ?? {}),
  ]);
  const SKIP = new Set(["updated_at", "created_at"]);
  return [...allKeys].filter((k) => {
    if (SKIP.has(k)) return false;
    return JSON.stringify((oldVal ?? {})[k]) !== JSON.stringify((newVal ?? {})[k]);
  });
}

function toCSV(rows: AuditRow[]): string {
  const headers = ["Timestamp", "User", "Action", "Entity Type", "Entity ID", "IP Address"];
  const lines = rows.map((r) =>
    [
      fmtTime(r.created_at),
      r.staff_profiles?.full_name ?? r.user_id ?? "System",
      r.action,
      entityLabel(r.entity_type),
      r.entity_id ?? "",
      r.ip_address ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(",")
  );
  return [headers.join(","), ...lines].join("\n");
}

// ── Diff Viewer Dialog ────────────────────────────────────────────

function DiffViewer({
  entry,
  open,
  onClose,
}: {
  entry: AuditRow | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!entry) return null;

  const changedKeys = diffKeys(entry.old_value, entry.new_value);
  const isDelete = entry.action === "DELETE";
  const isInsert = entry.action === "INSERT";
  const sourceObj = isDelete ? entry.old_value : entry.new_value;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded border ${ACTION_COLORS[entry.action] ?? ""}`}
            >
              {entry.action}
            </span>
            <span className="font-normal text-muted-foreground">
              {entityLabel(entry.entity_type)}
            </span>
            {entry.entity_id && (
              <span className="text-xs font-mono text-muted-foreground truncate max-w-[200px]">
                {entry.entity_id}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-0.5 text-xs text-muted-foreground mb-3">
          <p>{fmtTime(entry.created_at)}</p>
          {(entry.staff_profiles?.full_name ?? entry.user_id) && (
            <p>
              By:{" "}
              <span className="font-medium text-foreground">
                {entry.staff_profiles?.full_name ?? entry.user_id}
              </span>
            </p>
          )}
        </div>

        {/* UPDATE: field-by-field diff */}
        {entry.action === "UPDATE" && (
          changedKeys.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Fields Changed
              </p>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/60 border-b">
                      <th className="text-left px-3 py-2 font-medium w-1/3">Field</th>
                      <th className="text-left px-3 py-2 font-medium text-red-600">Before</th>
                      <th className="text-left px-3 py-2 font-medium text-green-600">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {changedKeys.map((key) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="px-3 py-2 font-mono text-muted-foreground">{key}</td>
                        <td className="px-3 py-2 font-mono bg-red-50 text-red-800 break-all">
                          {JSON.stringify((entry.old_value ?? {})[key])}
                        </td>
                        <td className="px-3 py-2 font-mono bg-green-50 text-green-800 break-all">
                          {JSON.stringify((entry.new_value ?? {})[key])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              No meaningful field changes detected (timestamps only).
            </p>
          )
        )}

        {/* INSERT / DELETE: snapshot */}
        {(isInsert || isDelete) && sourceObj && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isInsert ? "Created Record" : "Deleted Record"}
            </p>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-xs">
                <tbody>
                  {Object.entries(sourceObj).map(([key, val]) => (
                    <tr key={key} className="border-b last:border-0">
                      <td className="px-3 py-2 font-mono text-muted-foreground w-1/3">{key}</td>
                      <td
                        className={`px-3 py-2 font-mono break-all ${
                          isInsert ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                        }`}
                      >
                        {JSON.stringify(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Auth/admin events */}
        {["LOGIN", "LOGOUT", "INVITE", "ROLE_CHANGE"].includes(entry.action) &&
          entry.new_value && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Event Data
              </p>
              <pre className="text-xs bg-muted rounded p-3 overflow-auto">
                {JSON.stringify(entry.new_value, null, 2)}
              </pre>
            </div>
          )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ─────────────────────────────────────────────────────

export default function AuditLog() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterEntity, setFilterEntity] = useState("all");
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);

  const { data: rows = [], isLoading } = useQuery<AuditRow[]>({
    queryKey: ["audit-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*, staff_profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data ?? []) as AuditRow[];
    },
    staleTime: 30_000,
  });

  // Stats — today only
  const today = new Date().toDateString();
  const todayRows = rows.filter((r) => new Date(r.created_at).toDateString() === today);
  const statInserts = todayRows.filter((r) => r.action === "INSERT").length;
  const statUpdates = todayRows.filter((r) => r.action === "UPDATE").length;
  const statDeletes = todayRows.filter((r) => r.action === "DELETE").length;

  const uniqueEntityTypes = useMemo(
    () => [...new Set(rows.map((r) => r.entity_type))].sort(),
    [rows]
  );

  // Filter + search
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterAction !== "all" && r.action !== filterAction) return false;
      if (filterEntity !== "all" && r.entity_type !== filterEntity) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const name = r.staff_profiles?.full_name?.toLowerCase() ?? "";
        const eid = (r.entity_id ?? "").toLowerCase();
        const etype = entityLabel(r.entity_type).toLowerCase();
        if (!name.includes(q) && !eid.includes(q) && !etype.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterAction, filterEntity, searchTerm]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function handleExport() {
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">
            Tamper-evident record of all system actions and data changes.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={filtered.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "events today", value: todayRows.length, icon: Activity, bg: "bg-primary/10", color: "text-primary" },
          { label: "records created", value: statInserts, icon: PlusCircle, bg: "bg-green-100", color: "text-green-600" },
          { label: "records updated", value: statUpdates, icon: Pencil, bg: "bg-blue-100", color: "text-blue-600" },
          { label: "records deleted", value: statDeletes, icon: Trash2, bg: "bg-red-100", color: "text-red-500" },
        ].map(({ label, value, icon: Icon, bg, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-full p-2 ${bg}`}>
                  <Icon className={`h-4 w-4 ${color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user, entity, or ID…"
                className="pl-9"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(0);
                }}
              />
            </div>
            <Select
              value={filterAction}
              onValueChange={(v) => { setFilterAction(v); setPage(0); }}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {["INSERT", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "INVITE", "ROLE_CHANGE"].map(
                  (a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
            <Select
              value={filterEntity}
              onValueChange={(v) => { setFilterEntity(v); setPage(0); }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All entity types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All entity types</SelectItem>
                {uniqueEntityTypes.map((t) => (
                  <SelectItem key={t} value={t}>{entityLabel(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {filtered.length !== rows.length && (
            <p className="text-xs text-muted-foreground mt-2">
              Showing {filtered.length.toLocaleString()} of {rows.length.toLocaleString()} total events
            </p>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Activity Log
            <span className="text-muted-foreground font-normal text-sm ml-1">
              — {rows.length.toLocaleString()} total events
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Loading audit log…
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                {rows.length === 0
                  ? "No audit events yet. Events are captured automatically as you use the platform."
                  : "No events match your current filters."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[190px]">Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead className="w-[130px]">Action</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead className="hidden lg:table-cell">Entity ID</TableHead>
                    <TableHead className="hidden xl:table-cell w-[120px]">IP</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((row) => {
                    const ActionIcon = ACTION_ICONS[row.action] ?? Activity;
                    const hasDetail = row.old_value !== null || row.new_value !== null;
                    return (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {fmtTime(row.created_at)}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {row.staff_profiles?.full_name ?? (row.user_id ? "User" : "System")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`text-xs gap-1.5 ${ACTION_COLORS[row.action] ?? "bg-muted"}`}
                          >
                            <ActionIcon className="h-3 w-3" />
                            {row.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {entityLabel(row.entity_type)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="font-mono text-xs text-muted-foreground truncate max-w-[160px] block">
                            {row.entity_id ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {row.ip_address ?? "—"}
                        </TableCell>
                        <TableCell>
                          {hasDetail && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelected(row);
                                setDiffOpen(true);
                              }}
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Page {page + 1} of {totalPages} · {filtered.length.toLocaleString()} events
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-7 w-7"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <DiffViewer
        entry={selected}
        open={diffOpen}
        onClose={() => setDiffOpen(false)}
      />
    </div>
  );
}
