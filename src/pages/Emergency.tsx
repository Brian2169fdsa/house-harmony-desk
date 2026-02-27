import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, differenceInDays, isBefore, addDays } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";

import {
  ShieldAlert,
  Plus,
  Phone,
  Package,
  ClipboardList,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  AlertOctagon,
  CheckCircle2,
  Calendar,
  MapPin,
  UserCheck,
  Star,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ProtocolStep = {
  step_number: number;
  instruction: string;
  critical: boolean;
};

type Severity = "low" | "medium" | "high" | "critical";

type EventType =
  | "overdose"
  | "medical"
  | "fire"
  | "mental_health_crisis"
  | "violence"
  | "missing_resident"
  | "other";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const protocolTypeColors: Record<string, string> = {
  overdose: "bg-red-600 text-white hover:bg-red-700",
  fire: "bg-orange-500 text-white hover:bg-orange-600",
  medical: "bg-blue-500 text-white hover:bg-blue-600",
  mental_health_crisis: "bg-purple-600 text-white hover:bg-purple-700",
  violence: "bg-red-700 text-white hover:bg-red-800",
  missing_resident: "bg-amber-500 text-white hover:bg-amber-600",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-600 text-white hover:bg-red-700",
  high: "bg-orange-500 text-white hover:bg-orange-600",
  medium: "bg-yellow-500 text-black hover:bg-yellow-600",
  low: "bg-green-500 text-white hover:bg-green-600",
};

const eventTypeLabels: Record<string, string> = {
  overdose: "Overdose",
  medical: "Medical",
  fire: "Fire",
  mental_health_crisis: "Mental Health Crisis",
  violence: "Violence",
  missing_resident: "Missing Resident",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function Emergency() {
  const queryClient = useQueryClient();
  const today = new Date();

  // -- Dialog state --
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [addSupplyOpen, setAddSupplyOpen] = useState(false);
  const [logEventOpen, setLogEventOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  // -- Event log filters --
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [houseFilter, setHouseFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  // -- Collapsible protocols --
  const [openProtocols, setOpenProtocols] = useState<Set<string>>(new Set());

  // -- Form states --
  const [contactForm, setContactForm] = useState({
    resident_id: "",
    contact_name: "",
    relationship: "",
    phone: "",
    email: "",
    priority_order: 1,
    notes: "",
    is_sponsor: false,
  });

  const [supplyForm, setSupplyForm] = useState({
    house_id: "",
    supply_type: "",
    quantity: 1,
    expiration_date: "",
    location: "",
    notes: "",
  });

  const [eventForm, setEventForm] = useState({
    house_id: "",
    resident_id: "",
    event_type: "" as EventType | "",
    severity: "" as Severity | "",
    description: "",
    actions_taken: "",
    outcome: "",
  });

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*, residents(id, name)")
        .order("priority_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: protocols, isLoading: protocolsLoading } = useQuery({
    queryKey: ["emergency-protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_protocols")
        .select("*")
        .order("title", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: supplies, isLoading: suppliesLoading } = useQuery({
    queryKey: ["emergency-supplies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_supplies")
        .select("*, houses(id, name)")
        .order("expiration_date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["emergency-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_events")
        .select("*, houses(id, name), residents(id, name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name, status")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: houses } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("id, name")
        .order("name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // ---------------------------------------------------------------------------
  // Computed / Derived Values
  // ---------------------------------------------------------------------------

  const supplyStats = useMemo(() => {
    if (!supplies) return { expired: 0, expiringSoon: 0, notChecked: 0, lowQuantity: 0 };

    const expired = supplies.filter(
      (s) => s.expiration_date && isBefore(new Date(s.expiration_date), today)
    ).length;

    const expiringSoon = supplies.filter(
      (s) =>
        s.expiration_date &&
        !isBefore(new Date(s.expiration_date), today) &&
        isBefore(new Date(s.expiration_date), addDays(today, 30))
    ).length;

    const notChecked = supplies.filter(
      (s) => s.last_checked && differenceInDays(today, new Date(s.last_checked)) > 90
    ).length;

    const lowQuantity = supplies.filter(
      (s) => s.quantity != null && s.quantity <= 1
    ).length;

    return { expired, expiringSoon, notChecked, lowQuantity };
  }, [supplies]);

  const suppliesNeedingAttention = useMemo(() => {
    return supplyStats.expired + supplyStats.expiringSoon + supplyStats.lowQuantity;
  }, [supplyStats]);

  const eventsThisMonth = useMemo(() => {
    if (!events) return 0;
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return events.filter((e) => new Date(e.created_at) >= startOfMonth).length;
  }, [events]);

  const contactsByResident = useMemo(() => {
    if (!contacts) return {};
    const grouped: Record<string, { residentName: string; contacts: any[] }> = {};
    contacts.forEach((c: any) => {
      const residentId = c.resident_id || "unassigned";
      const residentName = c.residents?.name || "Unassigned";
      if (!grouped[residentId]) {
        grouped[residentId] = { residentName, contacts: [] };
      }
      grouped[residentId].contacts.push(c);
    });
    return grouped;
  }, [contacts]);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e: any) => {
      if (severityFilter !== "all" && e.severity !== severityFilter) return false;
      if (houseFilter !== "all" && e.house_id !== houseFilter) return false;
      if (eventTypeFilter !== "all" && e.event_type !== eventTypeFilter) return false;
      return true;
    });
  }, [events, severityFilter, houseFilter, eventTypeFilter]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------

  const markReviewedMutation = useMutation({
    mutationFn: async (protocolId: string) => {
      const { error } = await supabase
        .from("emergency_protocols")
        .update({
          last_reviewed: new Date().toISOString(),
          reviewed_by: "Current User",
        })
        .eq("id", protocolId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-protocols"] });
      toast.success("Protocol marked as reviewed");
    },
    onError: () => {
      toast.error("Failed to mark protocol as reviewed");
    },
  });

  const addContactMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_contacts").insert({
        resident_id: contactForm.resident_id || null,
        contact_name: contactForm.contact_name,
        relationship: contactForm.relationship,
        phone: contactForm.phone,
        email: contactForm.email || null,
        priority_order: contactForm.priority_order,
        notes: contactForm.notes || null,
        is_sponsor: contactForm.is_sponsor,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-contacts"] });
      toast.success("Emergency contact added successfully");
      setAddContactOpen(false);
      setContactForm({
        resident_id: "",
        contact_name: "",
        relationship: "",
        phone: "",
        email: "",
        priority_order: 1,
        notes: "",
        is_sponsor: false,
      });
    },
    onError: () => {
      toast.error("Failed to add emergency contact");
    },
  });

  const addSupplyMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_supplies").insert({
        house_id: supplyForm.house_id || null,
        supply_type: supplyForm.supply_type,
        quantity: supplyForm.quantity,
        expiration_date: supplyForm.expiration_date || null,
        location: supplyForm.location || null,
        notes: supplyForm.notes || null,
        last_checked: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-supplies"] });
      toast.success("Emergency supply added successfully");
      setAddSupplyOpen(false);
      setSupplyForm({
        house_id: "",
        supply_type: "",
        quantity: 1,
        expiration_date: "",
        location: "",
        notes: "",
      });
    },
    onError: () => {
      toast.error("Failed to add emergency supply");
    },
  });

  const markCheckedMutation = useMutation({
    mutationFn: async (supplyId: string) => {
      const { error } = await supabase
        .from("emergency_supplies")
        .update({ last_checked: new Date().toISOString() })
        .eq("id", supplyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-supplies"] });
      toast.success("Supply marked as checked");
    },
    onError: () => {
      toast.error("Failed to update supply check status");
    },
  });

  const logEventMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_events").insert({
        house_id: eventForm.house_id || null,
        resident_id: eventForm.resident_id || null,
        event_type: eventForm.event_type,
        severity: eventForm.severity,
        description: eventForm.description,
        actions_taken: eventForm.actions_taken || null,
        outcome: eventForm.outcome || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency-events"] });
      toast.success("Emergency event logged successfully");
      setLogEventOpen(false);
      setEventForm({
        house_id: "",
        resident_id: "",
        event_type: "",
        severity: "",
        description: "",
        actions_taken: "",
        outcome: "",
      });
    },
    onError: () => {
      toast.error("Failed to log emergency event");
    },
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getSupplyStatus(supply: any): { label: string; color: string } {
    if (
      supply.expiration_date &&
      isBefore(new Date(supply.expiration_date), today)
    ) {
      return { label: "Expired", color: "bg-red-600 text-white" };
    }
    if (
      supply.expiration_date &&
      isBefore(new Date(supply.expiration_date), addDays(today, 30))
    ) {
      return { label: "Expiring Soon", color: "bg-yellow-500 text-black" };
    }
    if (
      supply.last_checked &&
      differenceInDays(today, new Date(supply.last_checked)) > 90
    ) {
      return { label: "Not Checked", color: "bg-orange-500 text-white" };
    }
    return { label: "Good", color: "bg-green-500 text-white" };
  }

  function toggleProtocol(id: string) {
    setOpenProtocols((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-red-500" />
            Emergency Protocol & Response Center
          </h1>
          <p className="text-muted-foreground">
            Manage protocols, contacts, supplies, and emergency event logs
          </p>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Alert Banners                                                       */}
      {/* ================================================================== */}

      {supplyStats.expired > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <AlertOctagon className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">
            {supplyStats.expired} emergency{" "}
            {supplyStats.expired === 1 ? "supply has" : "supplies have"} expired
            and {supplyStats.expired === 1 ? "needs" : "need"} immediate
            replacement.
          </span>
        </div>
      )}

      {supplyStats.expiringSoon > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-200">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">
            {supplyStats.expiringSoon}{" "}
            {supplyStats.expiringSoon === 1 ? "supply is" : "supplies are"}{" "}
            expiring within the next 30 days.
          </span>
        </div>
      )}

      {supplyStats.notChecked > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-orange-300 bg-orange-50 p-4 text-orange-800 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-200">
          <Package className="h-5 w-5 flex-shrink-0" />
          <span className="font-medium">
            {supplyStats.notChecked}{" "}
            {supplyStats.notChecked === 1 ? "supply has" : "supplies have"} not
            been checked in over 90 days.
          </span>
        </div>
      )}

      {/* ================================================================== */}
      {/* Stats Cards                                                         */}
      {/* ================================================================== */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emergency Contacts
            </CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contacts?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Total registered contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Protocols
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{protocols?.length ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              Documented procedures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Supplies Attention
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {suppliesNeedingAttention}
            </div>
            <p className="text-xs text-muted-foreground">
              Expired, expiring, or low quantity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Events This Month
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Logged emergency events
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ================================================================== */}
      {/* Tabs                                                                */}
      {/* ================================================================== */}

      <Tabs defaultValue="protocols" className="space-y-4">
        <TabsList>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="supplies">Supplies</TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        {/* ============================================================== */}
        {/* PROTOCOLS TAB                                                   */}
        {/* ============================================================== */}
        <TabsContent value="protocols" className="space-y-4">
          {protocolsLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading protocols...
            </p>
          ) : protocols && protocols.length > 0 ? (
            <div className="space-y-3">
              {protocols.map((protocol: any) => {
                const steps: ProtocolStep[] = Array.isArray(protocol.steps_json)
                  ? (protocol.steps_json as ProtocolStep[])
                  : [];
                const isOpen = openProtocols.has(protocol.id);

                return (
                  <Collapsible
                    key={protocol.id}
                    open={isOpen}
                    onOpenChange={() => toggleProtocol(protocol.id)}
                  >
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CollapsibleTrigger asChild>
                            <button className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
                              {isOpen ? (
                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
                              )}
                              <div className="flex items-center gap-3">
                                <Badge
                                  className={
                                    protocolTypeColors[
                                      protocol.protocol_type
                                    ] || "bg-gray-500 text-white"
                                  }
                                >
                                  {protocol.protocol_type?.replace(/_/g, " ")}
                                </Badge>
                                <CardTitle className="text-base">
                                  {protocol.title}
                                </CardTitle>
                              </div>
                            </button>
                          </CollapsibleTrigger>
                          <div className="flex items-center gap-3">
                            {protocol.last_reviewed && (
                              <span className="text-xs text-muted-foreground">
                                Last reviewed:{" "}
                                {format(
                                  new Date(protocol.last_reviewed),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markReviewedMutation.mutate(protocol.id);
                              }}
                              disabled={markReviewedMutation.isPending}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Mark as Reviewed
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {steps.length > 0 ? (
                            <ol className="space-y-2">
                              {steps
                                .sort((a, b) => a.step_number - b.step_number)
                                .map((step) => (
                                  <li
                                    key={step.step_number}
                                    className={`flex items-start gap-3 rounded-md p-3 ${
                                      step.critical
                                        ? "bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800"
                                        : "bg-muted/50"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        step.critical
                                          ? "bg-red-600 text-white"
                                          : "bg-primary text-primary-foreground"
                                      }`}
                                    >
                                      {step.step_number}
                                    </span>
                                    <div className="flex items-start gap-2 flex-1">
                                      {step.critical && (
                                        <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                      )}
                                      <span
                                        className={
                                          step.critical
                                            ? "text-red-700 font-bold dark:text-red-300"
                                            : "text-foreground"
                                        }
                                      >
                                        {step.instruction}
                                      </span>
                                    </div>
                                  </li>
                                ))}
                            </ol>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No steps defined for this protocol.
                            </p>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No emergency protocols found.
              </p>
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* CONTACTS TAB                                                    */}
        {/* ============================================================== */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                  <DialogDescription>
                    Add a new emergency contact for a resident.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contact-resident">Resident</Label>
                    <Select
                      value={contactForm.resident_id}
                      onValueChange={(val) =>
                        setContactForm((prev) => ({
                          ...prev,
                          resident_id: val,
                        }))
                      }
                    >
                      <SelectTrigger id="contact-resident">
                        <SelectValue placeholder="Select resident" />
                      </SelectTrigger>
                      <SelectContent>
                        {residents?.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-name">Contact Name *</Label>
                    <Input
                      id="contact-name"
                      value={contactForm.contact_name}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          contact_name: e.target.value,
                        }))
                      }
                      placeholder="Full name"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-relationship">
                      Relationship *
                    </Label>
                    <Input
                      id="contact-relationship"
                      value={contactForm.relationship}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          relationship: e.target.value,
                        }))
                      }
                      placeholder="e.g., Mother, Father, Sponsor"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="contact-phone">Phone *</Label>
                      <Input
                        id="contact-phone"
                        type="tel"
                        value={contactForm.phone}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact-email">Email</Label>
                      <Input
                        id="contact-email"
                        type="email"
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-priority">Priority Order</Label>
                    <Input
                      id="contact-priority"
                      type="number"
                      min={1}
                      value={contactForm.priority_order}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          priority_order: parseInt(e.target.value) || 1,
                        }))
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contact-notes">Notes</Label>
                    <Textarea
                      id="contact-notes"
                      value={contactForm.notes}
                      onChange={(e) =>
                        setContactForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contact-sponsor"
                      checked={contactForm.is_sponsor}
                      onCheckedChange={(checked) =>
                        setContactForm((prev) => ({
                          ...prev,
                          is_sponsor: checked === true,
                        }))
                      }
                    />
                    <Label
                      htmlFor="contact-sponsor"
                      className="text-sm font-normal"
                    >
                      This contact is a sponsor
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddContactOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addContactMutation.mutate()}
                    disabled={
                      !contactForm.contact_name ||
                      !contactForm.phone ||
                      !contactForm.relationship ||
                      addContactMutation.isPending
                    }
                  >
                    {addContactMutation.isPending ? "Adding..." : "Add Contact"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {contactsLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading contacts...
            </p>
          ) : contacts && contacts.length > 0 ? (
            <div className="space-y-6">
              {Object.entries(contactsByResident).map(
                ([residentId, group]) => (
                  <div key={residentId}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <UserCheck className="h-5 w-5 text-muted-foreground" />
                      {group.residentName}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {group.contacts.map((contact: any) => (
                        <Card key={contact.id}>
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-foreground">
                                  {contact.contact_name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {contact.relationship}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {contact.is_sponsor && (
                                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                    <Star className="mr-1 h-3 w-3" />
                                    Sponsor
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs">
                                  #{contact.priority_order}
                                </Badge>
                              </div>
                            </div>

                            <div className="space-y-1 mt-3">
                              <a
                                href={`tel:${contact.phone}`}
                                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Phone className="h-3.5 w-3.5" />
                                {contact.phone}
                              </a>
                              {contact.email && (
                                <p className="text-sm text-muted-foreground">
                                  {contact.email}
                                </p>
                              )}
                            </div>

                            {contact.notes && (
                              <p className="text-xs text-muted-foreground mt-2 italic">
                                {contact.notes}
                              </p>
                            )}

                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full"
                                asChild
                              >
                                <a href={`tel:${contact.phone}`}>
                                  <Phone className="mr-2 h-4 w-4" />
                                  Quick Call
                                </a>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Phone className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No emergency contacts found.
              </p>
              <Button onClick={() => setAddContactOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Contact
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* SUPPLIES TAB                                                    */}
        {/* ============================================================== */}
        <TabsContent value="supplies" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addSupplyOpen} onOpenChange={setAddSupplyOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Supply
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Supply</DialogTitle>
                  <DialogDescription>
                    Track a new emergency supply item.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="supply-house">House</Label>
                    <Select
                      value={supplyForm.house_id}
                      onValueChange={(val) =>
                        setSupplyForm((prev) => ({
                          ...prev,
                          house_id: val,
                        }))
                      }
                    >
                      <SelectTrigger id="supply-house">
                        <SelectValue placeholder="Select house" />
                      </SelectTrigger>
                      <SelectContent>
                        {houses?.map((h) => (
                          <SelectItem key={h.id} value={h.id}>
                            {h.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supply-type">Supply Type *</Label>
                    <Input
                      id="supply-type"
                      value={supplyForm.supply_type}
                      onChange={(e) =>
                        setSupplyForm((prev) => ({
                          ...prev,
                          supply_type: e.target.value,
                        }))
                      }
                      placeholder="e.g., Narcan, First Aid Kit, Fire Extinguisher"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="supply-quantity">Quantity *</Label>
                      <Input
                        id="supply-quantity"
                        type="number"
                        min={0}
                        value={supplyForm.quantity}
                        onChange={(e) =>
                          setSupplyForm((prev) => ({
                            ...prev,
                            quantity: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="supply-expiration">
                        Expiration Date
                      </Label>
                      <Input
                        id="supply-expiration"
                        type="date"
                        value={supplyForm.expiration_date}
                        onChange={(e) =>
                          setSupplyForm((prev) => ({
                            ...prev,
                            expiration_date: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supply-location">Location</Label>
                    <Input
                      id="supply-location"
                      value={supplyForm.location}
                      onChange={(e) =>
                        setSupplyForm((prev) => ({
                          ...prev,
                          location: e.target.value,
                        }))
                      }
                      placeholder="e.g., Kitchen cabinet, Front hallway"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="supply-notes">Notes</Label>
                    <Textarea
                      id="supply-notes"
                      value={supplyForm.notes}
                      onChange={(e) =>
                        setSupplyForm((prev) => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Additional notes..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setAddSupplyOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => addSupplyMutation.mutate()}
                    disabled={
                      !supplyForm.supply_type || addSupplyMutation.isPending
                    }
                  >
                    {addSupplyMutation.isPending ? "Adding..." : "Add Supply"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {suppliesLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading supplies...
            </p>
          ) : supplies && supplies.length > 0 ? (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Supply Type</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Expiration Date</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies.map((supply: any) => {
                    const status = getSupplyStatus(supply);
                    const isLowQty =
                      supply.quantity != null && supply.quantity <= 1;

                    return (
                      <TableRow key={supply.id}>
                        <TableCell>
                          {(supply as any).houses?.name || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {supply.supply_type}
                          {isLowQty && (
                            <Badge
                              variant="outline"
                              className="ml-2 border-red-300 text-red-600 text-xs"
                            >
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              Low
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{supply.quantity}</TableCell>
                        <TableCell>
                          {supply.expiration_date
                            ? format(
                                new Date(supply.expiration_date),
                                "MMM d, yyyy"
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {supply.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground" />
                              {supply.location}
                            </span>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell>
                          {supply.last_checked
                            ? format(
                                new Date(supply.last_checked),
                                "MMM d, yyyy"
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              markCheckedMutation.mutate(supply.id)
                            }
                            disabled={markCheckedMutation.isPending}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Mark Checked
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                No emergency supplies tracked.
              </p>
              <Button onClick={() => setAddSupplyOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add First Supply
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ============================================================== */}
        {/* EVENT LOG TAB                                                   */}
        {/* ============================================================== */}
        <TabsContent value="events" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={severityFilter}
                onValueChange={setSeverityFilter}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={houseFilter} onValueChange={setHouseFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="House" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Houses</SelectItem>
                  {houses?.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={eventTypeFilter}
                onValueChange={setEventTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(eventTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={logEventOpen} onOpenChange={setLogEventOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <AlertOctagon className="mr-2 h-4 w-4" />
                  Log Emergency Event
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Log Emergency Event</DialogTitle>
                  <DialogDescription>
                    Record details of an emergency event.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="event-house">House</Label>
                      <Select
                        value={eventForm.house_id}
                        onValueChange={(val) =>
                          setEventForm((prev) => ({
                            ...prev,
                            house_id: val,
                          }))
                        }
                      >
                        <SelectTrigger id="event-house">
                          <SelectValue placeholder="Select house" />
                        </SelectTrigger>
                        <SelectContent>
                          {houses?.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {h.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-resident">
                        Resident (optional)
                      </Label>
                      <Select
                        value={eventForm.resident_id}
                        onValueChange={(val) =>
                          setEventForm((prev) => ({
                            ...prev,
                            resident_id: val,
                          }))
                        }
                      >
                        <SelectTrigger id="event-resident">
                          <SelectValue placeholder="Select resident" />
                        </SelectTrigger>
                        <SelectContent>
                          {residents?.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="event-type">Event Type *</Label>
                      <Select
                        value={eventForm.event_type}
                        onValueChange={(val) =>
                          setEventForm((prev) => ({
                            ...prev,
                            event_type: val as EventType,
                          }))
                        }
                      >
                        <SelectTrigger id="event-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(eventTypeLabels).map(
                            ([key, label]) => (
                              <SelectItem key={key} value={key}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="event-severity">Severity *</Label>
                      <Select
                        value={eventForm.severity}
                        onValueChange={(val) =>
                          setEventForm((prev) => ({
                            ...prev,
                            severity: val as Severity,
                          }))
                        }
                      >
                        <SelectTrigger id="event-severity">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="event-description">Description *</Label>
                    <Textarea
                      id="event-description"
                      value={eventForm.description}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Describe the emergency event..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="event-actions">Actions Taken</Label>
                    <Textarea
                      id="event-actions"
                      value={eventForm.actions_taken}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          actions_taken: e.target.value,
                        }))
                      }
                      placeholder="Describe actions taken in response..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="event-outcome">Outcome</Label>
                    <Textarea
                      id="event-outcome"
                      value={eventForm.outcome}
                      onChange={(e) =>
                        setEventForm((prev) => ({
                          ...prev,
                          outcome: e.target.value,
                        }))
                      }
                      placeholder="Describe the outcome..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setLogEventOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => logEventMutation.mutate()}
                    disabled={
                      !eventForm.event_type ||
                      !eventForm.severity ||
                      !eventForm.description ||
                      logEventMutation.isPending
                    }
                  >
                    {logEventMutation.isPending ? "Logging..." : "Log Event"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {eventsLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading events...
            </p>
          ) : filteredEvents.length > 0 ? (
            <>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>House</TableHead>
                      <TableHead>Resident</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event: any) => (
                      <TableRow
                        key={event.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEventDetailOpen(true);
                        }}
                      >
                        <TableCell className="whitespace-nowrap">
                          {format(
                            new Date(event.created_at),
                            "MMM d, yyyy h:mm a"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {eventTypeLabels[event.event_type] ||
                              event.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              severityColors[event.severity] || "bg-gray-500"
                            }
                          >
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(event as any).houses?.name || "N/A"}
                        </TableCell>
                        <TableCell>
                          {(event as any).residents?.name || "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {event.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Event Detail Dialog */}
              <Dialog
                open={eventDetailOpen}
                onOpenChange={setEventDetailOpen}
              >
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-red-500" />
                      Emergency Event Detail
                    </DialogTitle>
                    <DialogDescription>
                      Full details of the logged emergency event.
                    </DialogDescription>
                  </DialogHeader>
                  {selectedEvent && (
                    <div className="space-y-4 py-2">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            severityColors[selectedEvent.severity] ||
                            "bg-gray-500"
                          }
                        >
                          {selectedEvent.severity}
                        </Badge>
                        <Badge variant="outline">
                          {eventTypeLabels[selectedEvent.event_type] ||
                            selectedEvent.event_type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Date & Time</p>
                          <p className="font-medium">
                            {format(
                              new Date(selectedEvent.created_at),
                              "MMMM d, yyyy h:mm a"
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">House</p>
                          <p className="font-medium">
                            {(selectedEvent as any).houses?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Resident</p>
                          <p className="font-medium">
                            {(selectedEvent as any).residents?.name || "N/A"}
                          </p>
                        </div>
                        {selectedEvent.created_by && (
                          <div>
                            <p className="text-muted-foreground">Logged By</p>
                            <p className="font-medium">
                              {selectedEvent.created_by}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Description
                        </p>
                        <p className="text-sm bg-muted/50 rounded-md p-3">
                          {selectedEvent.description}
                        </p>
                      </div>

                      {selectedEvent.actions_taken && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Actions Taken
                          </p>
                          <p className="text-sm bg-muted/50 rounded-md p-3">
                            {selectedEvent.actions_taken}
                          </p>
                        </div>
                      )}

                      {selectedEvent.outcome && (
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">
                            Outcome
                          </p>
                          <p className="text-sm bg-muted/50 rounded-md p-3">
                            {selectedEvent.outcome}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {events && events.length > 0
                  ? "No events match the current filters."
                  : "No emergency events logged."}
              </p>
              {events && events.length === 0 && (
                <Button
                  variant="destructive"
                  onClick={() => setLogEventOpen(true)}
                >
                  <AlertOctagon className="mr-2 h-4 w-4" />
                  Log First Event
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
