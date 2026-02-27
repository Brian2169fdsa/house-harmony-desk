import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { AlertOctagon, Plus, Phone, Package, ClipboardList, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Emergency() {
  const queryClient = useQueryClient();

  const [contactOpen, setContactOpen] = useState(false);
  const [supplyOpen, setSupplyOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);

  const [contactForm, setContactForm] = useState({
    residentId: "", contactName: "", relationship: "", phone: "",
    email: "", priorityOrder: "1", notes: "",
  });
  const [supplyForm, setSupplyForm] = useState({
    houseId: "", supplyType: "narcan", quantity: "1",
    expirationDate: "", location: "", notes: "",
  });
  const [eventForm, setEventForm] = useState({
    houseId: "", residentId: "", eventType: "", description: "",
    actionsTaken: "", outcome: "",
  });

  const { data: residents } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: houses } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: contacts } = useQuery({
    queryKey: ["emergency_contacts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*, residents(name)")
        .order("priority_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: protocols } = useQuery({
    queryKey: ["emergency_protocols"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_protocols")
        .select("*")
        .order("protocol_type");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: supplies } = useQuery({
    queryKey: ["emergency_supplies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_supplies")
        .select("*, houses(name)")
        .order("expiration_date");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["emergency_events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_events")
        .select("*, houses(name), residents(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  const addContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_contacts").insert({
        resident_id: contactForm.residentId,
        contact_name: contactForm.contactName,
        relationship: contactForm.relationship,
        phone: contactForm.phone,
        email: contactForm.email || null,
        priority_order: parseInt(contactForm.priorityOrder, 10),
        notes: contactForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_contacts"] });
      toast({ title: "Emergency contact added" });
      setContactOpen(false);
      setContactForm({ residentId: "", contactName: "", relationship: "", phone: "", email: "", priorityOrder: "1", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to add contact", variant: "destructive" });
    },
  });

  const addSupply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("emergency_supplies").insert({
        house_id: supplyForm.houseId,
        supply_type: supplyForm.supplyType,
        quantity: parseInt(supplyForm.quantity, 10),
        expiration_date: supplyForm.expirationDate || null,
        location: supplyForm.location || null,
        notes: supplyForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_supplies"] });
      toast({ title: "Supply item added" });
      setSupplyOpen(false);
      setSupplyForm({ houseId: "", supplyType: "narcan", quantity: "1", expirationDate: "", location: "", notes: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to add supply", variant: "destructive" });
    },
  });

  const logEvent = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from("emergency_events").insert({
        house_id: eventForm.houseId,
        resident_id: eventForm.residentId || null,
        event_type: eventForm.eventType,
        description: eventForm.description,
        actions_taken: eventForm.actionsTaken || null,
        outcome: eventForm.outcome || null,
        created_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_events"] });
      toast({ title: "Emergency event logged" });
      setEventOpen(false);
      setEventForm({ houseId: "", residentId: "", eventType: "", description: "", actionsTaken: "", outcome: "" });
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to log event", variant: "destructive" });
    },
  });

  const today = new Date();
  const expiringSupplies = supplies?.filter((s) => {
    if (!s.expiration_date) return false;
    const exp = new Date(s.expiration_date);
    const thirtyDays = new Date(today);
    thirtyDays.setDate(today.getDate() + 30);
    return exp <= thirtyDays;
  }) ?? [];

  const ResidentSelect = ({ value, onChange, placeholder = "Select resident" }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {residents?.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const HouseSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Select house" /></SelectTrigger>
      <SelectContent>
        {houses?.map((h) => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <AlertOctagon className="h-8 w-8 text-red-500" />
            Emergency Protocols
          </h1>
          <p className="text-muted-foreground">
            Emergency contacts, protocols, supply inventory, and event log
          </p>
        </div>
        <Dialog open={eventOpen} onOpenChange={setEventOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" />
              Log Emergency Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Log Emergency Event</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>House *</Label><HouseSelect value={eventForm.houseId} onChange={(v) => setEventForm({ ...eventForm, houseId: v })} /></div>
              <div><Label>Resident Involved</Label><ResidentSelect value={eventForm.residentId} onChange={(v) => setEventForm({ ...eventForm, residentId: v })} placeholder="Optional" /></div>
              <div><Label>Event Type *</Label><Input placeholder="e.g. Overdose, Medical, Fire, Missing Person" value={eventForm.eventType} onChange={(e) => setEventForm({ ...eventForm, eventType: e.target.value })} /></div>
              <div><Label>Description *</Label><Textarea placeholder="What happened?" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} /></div>
              <div><Label>Actions Taken</Label><Textarea placeholder="Steps taken, who was notified, etc." value={eventForm.actionsTaken} onChange={(e) => setEventForm({ ...eventForm, actionsTaken: e.target.value })} /></div>
              <div><Label>Outcome</Label><Input placeholder="e.g. Resident transported to ER, Fire contained" value={eventForm.outcome} onChange={(e) => setEventForm({ ...eventForm, outcome: e.target.value })} /></div>
              <Button className="w-full" variant="destructive" onClick={() => logEvent.mutate()} disabled={!eventForm.houseId || !eventForm.eventType || !eventForm.description || logEvent.isPending}>
                {logEvent.isPending ? "Saving…" : "Log Event"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {expiringSupplies.length > 0 && (
        <div className="flex items-center gap-2 rounded-md bg-warning/10 border border-warning/30 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
          <span>{expiringSupplies.length} supply item(s) expiring within 30 days</span>
        </div>
      )}

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts">
            <Phone className="mr-2 h-4 w-4" />
            Emergency Contacts
          </TabsTrigger>
          <TabsTrigger value="protocols">
            <ClipboardList className="mr-2 h-4 w-4" />
            Protocols
          </TabsTrigger>
          <TabsTrigger value="supplies">
            <Package className="mr-2 h-4 w-4" />
            Supplies
          </TabsTrigger>
          <TabsTrigger value="events">Event Log</TabsTrigger>
        </TabsList>

        {/* ─── Contacts ─── */}
        <TabsContent value="contacts" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Add Emergency Contact</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>Resident *</Label><ResidentSelect value={contactForm.residentId} onChange={(v) => setContactForm({ ...contactForm, residentId: v })} /></div>
                  <div><Label>Contact Name *</Label><Input placeholder="Full name" value={contactForm.contactName} onChange={(e) => setContactForm({ ...contactForm, contactName: e.target.value })} /></div>
                  <div><Label>Relationship *</Label><Input placeholder="e.g. Sponsor, Parent, Probation Officer" value={contactForm.relationship} onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })} /></div>
                  <div><Label>Phone *</Label><Input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} /></div>
                  <div><Label>Email</Label><Input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} /></div>
                  <div>
                    <Label>Priority Order</Label>
                    <Select value={contactForm.priorityOrder} onValueChange={(v) => setContactForm({ ...contactForm, priorityOrder: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>#{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Notes</Label><Textarea value={contactForm.notes} onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={() => addContact.mutate()} disabled={!contactForm.residentId || !contactForm.contactName || !contactForm.phone || addContact.isPending}>
                    {addContact.isPending ? "Saving…" : "Add Contact"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Resident</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Relationship</TableHead>
                    <TableHead>Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts && contacts.length > 0 ? contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="text-muted-foreground">{c.priority_order}</TableCell>
                      <TableCell className="font-medium">{(c as any).residents?.name ?? "—"}</TableCell>
                      <TableCell>{c.contact_name}</TableCell>
                      <TableCell><Badge variant="outline">{c.relationship}</Badge></TableCell>
                      <TableCell><a href={`tel:${c.phone}`} className="text-primary underline">{c.phone}</a></TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No emergency contacts</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Protocols ─── */}
        <TabsContent value="protocols" className="mt-4">
          <div className="grid gap-4">
            {protocols?.map((p) => (
              <Card key={p.id} className={p.protocol_type === "overdose" ? "border-red-200" : ""}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    {p.protocol_type === "overdose" && <span className="text-red-500">⚠️</span>}
                    {p.title}
                  </CardTitle>
                  {p.last_reviewed && (
                    <p className="text-xs text-muted-foreground">Last reviewed: {p.last_reviewed}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {(Array.isArray(p.steps_json) ? p.steps_json as string[] : []).map((step, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="shrink-0 font-bold text-primary">{i + 1}.</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
            {(!protocols || protocols.length === 0) && (
              <p className="text-muted-foreground py-8 text-center">No protocols configured</p>
            )}
          </div>
        </TabsContent>

        {/* ─── Supplies ─── */}
        <TabsContent value="supplies" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Dialog open={supplyOpen} onOpenChange={setSupplyOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Add Supply</Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Add Emergency Supply</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div><Label>House *</Label><HouseSelect value={supplyForm.houseId} onChange={(v) => setSupplyForm({ ...supplyForm, houseId: v })} /></div>
                  <div>
                    <Label>Supply Type *</Label>
                    <Select value={supplyForm.supplyType} onValueChange={(v) => setSupplyForm({ ...supplyForm, supplyType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="narcan">Narcan (Naloxone)</SelectItem>
                        <SelectItem value="first_aid_kit">First Aid Kit</SelectItem>
                        <SelectItem value="fire_extinguisher">Fire Extinguisher</SelectItem>
                        <SelectItem value="aed">AED Defibrillator</SelectItem>
                        <SelectItem value="gloves">Protective Gloves</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Quantity</Label><Input type="number" min="1" value={supplyForm.quantity} onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })} /></div>
                  <div><Label>Expiration Date</Label><Input type="date" value={supplyForm.expirationDate} onChange={(e) => setSupplyForm({ ...supplyForm, expirationDate: e.target.value })} /></div>
                  <div><Label>Location in House</Label><Input placeholder="e.g. Kitchen cabinet, Manager office" value={supplyForm.location} onChange={(e) => setSupplyForm({ ...supplyForm, location: e.target.value })} /></div>
                  <div><Label>Notes</Label><Textarea value={supplyForm.notes} onChange={(e) => setSupplyForm({ ...supplyForm, notes: e.target.value })} /></div>
                  <Button className="w-full" onClick={() => addSupply.mutate()} disabled={!supplyForm.houseId || addSupply.isPending}>
                    {addSupply.isPending ? "Saving…" : "Add Supply"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Supply</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplies && supplies.length > 0 ? supplies.map((s) => {
                    const isExpiring = s.expiration_date && new Date(s.expiration_date) <= new Date(today.getTime() + 30 * 86400000);
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{(s as any).houses?.name ?? "—"}</TableCell>
                        <TableCell className="capitalize">{s.supply_type.replace("_", " ")}</TableCell>
                        <TableCell>{s.quantity}</TableCell>
                        <TableCell className={isExpiring ? "text-warning font-medium" : ""}>{s.expiration_date ?? "N/A"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.location ?? "—"}</TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No supplies logged</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Events ─── */}
        <TabsContent value="events" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>House</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Outcome</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events && events.length > 0 ? events.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell className="text-sm">{new Date(ev.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{(ev as any).houses?.name ?? "—"}</TableCell>
                      <TableCell><Badge variant="destructive">{ev.event_type}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{ev.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ev.outcome ?? "—"}</TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No emergency events recorded</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
