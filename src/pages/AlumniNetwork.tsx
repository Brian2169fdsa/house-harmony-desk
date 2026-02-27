import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Users, Heart, Briefcase, Home, Phone, Loader2, AlertTriangle } from "lucide-react";
import { format, parseISO, differenceInDays, addDays } from "date-fns";
import { toast } from "sonner";

const CHECK_IN_MILESTONES = [30, 60, 90, 180, 365];

export default function AlumniNetwork() {
  const queryClient = useQueryClient();
  const [profileOpen,  setProfileOpen]  = useState(false);
  const [checkinOpen,  setCheckinOpen]  = useState(false);
  const [pairOpen,     setPairOpen]     = useState(false);
  const [selectedAlumni, setSelectedAlumni] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMentor, setFilterMentor] = useState("all");

  const [profileForm, setProfileForm] = useState({
    resident_id: "", sober_date: "", current_city: "",
    willing_to_mentor: false, contact_email: "", contact_phone: "", opt_in: true,
  });
  const [checkinForm, setCheckinForm] = useState({
    alumni_id: "", checkin_date: format(new Date(), "yyyy-MM-dd"),
    method: "phone", sobriety_confirmed: true, employment_status: "", housing_status: "", notes: "",
  });
  const [pairForm, setPairForm] = useState({ alumni_id: "", resident_id: "", notes: "" });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents_all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("residents").select("id, name, status, move_out_date");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: alumni = [], isLoading } = useQuery({
    queryKey: ["alumni_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alumni_profiles")
        .select("*, residents(name, move_out_date)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: checkins = [] } = useQuery({
    queryKey: ["alumni_checkins"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alumni_checkins")
        .select("*")
        .order("checkin_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pairs = [] } = useQuery({
    queryKey: ["mentorship_pairs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorship_pairs")
        .select("*, alumni_profiles(residents(name)), residents(name)")
        .eq("status", "active");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Alumni who need a check-in (no recent check-in at their next milestone)
  const alumniNeedingCheckin = alumni.filter((a: any) => {
    if (!a.residents?.move_out_date) return false;
    const dischargeDate = parseISO(a.residents.move_out_date);
    const lastCheckin   = checkins.filter((c: any) => c.alumni_id === a.id).sort((x: any, y: any) => y.checkin_date > x.checkin_date ? 1 : -1)[0];
    const daysSince     = differenceInDays(new Date(), dischargeDate);
    const nextMilestone = CHECK_IN_MILESTONES.find((m) => m > (lastCheckin ? differenceInDays(parseISO(lastCheckin.checkin_date), dischargeDate) : 0));
    return nextMilestone !== undefined && daysSince >= nextMilestone;
  });

  const addProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alumni_profiles").insert({
        resident_id:       profileForm.resident_id,
        opt_in:            profileForm.opt_in,
        sober_date:        profileForm.sober_date || null,
        current_city:      profileForm.current_city || null,
        willing_to_mentor: profileForm.willing_to_mentor,
        contact_email:     profileForm.contact_email || null,
        contact_phone:     profileForm.contact_phone || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumni_profiles"] });
      setProfileOpen(false);
      setProfileForm({ resident_id: "", sober_date: "", current_city: "", willing_to_mentor: false, contact_email: "", contact_phone: "", opt_in: true });
      toast.success("Alumni profile created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addCheckin = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alumni_checkins").insert({
        alumni_id:         checkinForm.alumni_id,
        checkin_date:      checkinForm.checkin_date,
        method:            checkinForm.method,
        sobriety_confirmed: checkinForm.sobriety_confirmed,
        employment_status: checkinForm.employment_status || null,
        housing_status:    checkinForm.housing_status || null,
        notes:             checkinForm.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alumni_checkins"] });
      setCheckinOpen(false);
      setCheckinForm({ alumni_id: "", checkin_date: format(new Date(), "yyyy-MM-dd"), method: "phone", sobriety_confirmed: true, employment_status: "", housing_status: "", notes: "" });
      toast.success("Check-in recorded");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const addPair = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("mentorship_pairs").insert({
        alumni_id:   pairForm.alumni_id,
        resident_id: pairForm.resident_id,
        notes:       pairForm.notes || null,
        status:      "active",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentorship_pairs"] });
      setPairOpen(false);
      setPairForm({ alumni_id: "", resident_id: "", notes: "" });
      toast.success("Mentorship pair created");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredAlumni = alumni.filter((a: any) => {
    const name = (a.residents as any)?.name ?? "";
    const matchSearch = !searchTerm || name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.current_city ?? "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchMentor = filterMentor === "all" || (filterMentor === "mentor" && a.willing_to_mentor);
    return matchSearch && matchMentor;
  });

  const sobrietyConfirmed = checkins.filter((c: any) => c.sobriety_confirmed).length;
  const sobrietyRate = checkins.length > 0 ? Math.round((sobrietyConfirmed / checkins.length) * 100) : 0;
  const employedCount = checkins.filter((c: any) => c.employment_status === "employed").length;
  const mentors = alumni.filter((a: any) => a.willing_to_mentor).length;

  // Discharged residents not yet in alumni
  const alumniResidentIds = new Set(alumni.map((a: any) => a.resident_id));
  const dischargedNotAlumni = residents.filter((r: any) => r.move_out_date && !alumniResidentIds.has(r.id));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alumni Network</h1>
          <p className="text-muted-foreground">After-care check-ins, mentorship matching, and outcomes tracking</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={pairOpen} onOpenChange={setPairOpen}>
            <DialogTrigger asChild><Button variant="outline">Match Mentor</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Mentorship Pair</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Alumni (Mentor) *</Label>
                  <Select value={pairForm.alumni_id} onValueChange={(v) => setPairForm({ ...pairForm, alumni_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select alumni mentor" /></SelectTrigger>
                    <SelectContent>
                      {alumni.filter((a: any) => a.willing_to_mentor).map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{(a.residents as any)?.name ?? a.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Current Resident (Mentee) *</Label>
                  <Select value={pairForm.resident_id} onValueChange={(v) => setPairForm({ ...pairForm, resident_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select resident" /></SelectTrigger>
                    <SelectContent>
                      {residents.filter((r: any) => r.status === "active").map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={pairForm.notes} onChange={(e) => setPairForm({ ...pairForm, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setPairOpen(false)}>Cancel</Button>
                  <Button disabled={!pairForm.alumni_id || !pairForm.resident_id || addPair.isPending} onClick={() => addPair.mutate()}>
                    {addPair.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Create Pair
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={checkinOpen} onOpenChange={setCheckinOpen}>
            <DialogTrigger asChild><Button variant="outline">Log Check-In</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Alumni Check-In</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Alumni *</Label>
                  <Select value={checkinForm.alumni_id} onValueChange={(v) => setCheckinForm({ ...checkinForm, alumni_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select alumni" /></SelectTrigger>
                    <SelectContent>
                      {alumni.map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>{(a.residents as any)?.name ?? a.id}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Date *</Label>
                    <Input type="date" value={checkinForm.checkin_date} onChange={(e) => setCheckinForm({ ...checkinForm, checkin_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Method</Label>
                    <Select value={checkinForm.method} onValueChange={(v) => setCheckinForm({ ...checkinForm, method: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["phone","text","email","in_person"].map((m) => (
                          <SelectItem key={m} value={m}>{m.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Employment</Label>
                    <Select value={checkinForm.employment_status} onValueChange={(v) => setCheckinForm({ ...checkinForm, employment_status: v })}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {["employed","unemployed","self_employed","unknown"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Housing</Label>
                    <Select value={checkinForm.housing_status} onValueChange={(v) => setCheckinForm({ ...checkinForm, housing_status: v })}>
                      <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        {["independent","sober_living","family","homeless","other","unknown"].map((s) => (
                          <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="sober-confirmed"
                    checked={checkinForm.sobriety_confirmed}
                    onCheckedChange={(v) => setCheckinForm({ ...checkinForm, sobriety_confirmed: !!v })}
                  />
                  <label htmlFor="sober-confirmed" className="text-sm">Sobriety confirmed</label>
                </div>
                <div className="space-y-1">
                  <Label>Notes</Label>
                  <Textarea rows={2} value={checkinForm.notes} onChange={(e) => setCheckinForm({ ...checkinForm, notes: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancel</Button>
                  <Button disabled={!checkinForm.alumni_id || addCheckin.isPending} onClick={() => addCheckin.mutate()}>
                    {addCheckin.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Add Alumni</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Alumni Profile</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <Label>Resident *</Label>
                  <Select value={profileForm.resident_id} onValueChange={(v) => setProfileForm({ ...profileForm, resident_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select discharged resident" /></SelectTrigger>
                    <SelectContent>
                      {dischargedNotAlumni.map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                      {residents.filter((r: any) => !r.move_out_date).map((r: any) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} (active)</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Sober Date</Label>
                    <Input type="date" value={profileForm.sober_date} onChange={(e) => setProfileForm({ ...profileForm, sober_date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Current City</Label>
                    <Input value={profileForm.current_city} onChange={(e) => setProfileForm({ ...profileForm, current_city: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Contact Email</Label>
                    <Input type="email" value={profileForm.contact_email} onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Contact Phone</Label>
                    <Input value={profileForm.contact_phone} onChange={(e) => setProfileForm({ ...profileForm, contact_phone: e.target.value })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="mentor-willing"
                    checked={profileForm.willing_to_mentor}
                    onCheckedChange={(v) => setProfileForm({ ...profileForm, willing_to_mentor: !!v })}
                  />
                  <label htmlFor="mentor-willing" className="text-sm">Willing to mentor current residents</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="opt-in"
                    checked={profileForm.opt_in}
                    onCheckedChange={(v) => setProfileForm({ ...profileForm, opt_in: !!v })}
                  />
                  <label htmlFor="opt-in" className="text-sm">Opted in to alumni network</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
                  <Button disabled={!profileForm.resident_id || addProfile.isPending} onClick={() => addProfile.mutate()}>
                    {addProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Add
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Users className="h-6 w-6 text-primary" /><div>
            <p className="text-2xl font-bold">{alumni.length}</p>
            <p className="text-xs text-muted-foreground">Alumni Total</p>
          </div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Heart className="h-6 w-6 text-green-500" /><div>
            <p className="text-2xl font-bold text-green-600">{sobrietyRate}%</p>
            <p className="text-xs text-muted-foreground">Sobriety Confirmed</p>
          </div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Briefcase className="h-6 w-6 text-blue-500" /><div>
            <p className="text-2xl font-bold text-blue-600">{employedCount}</p>
            <p className="text-xs text-muted-foreground">Employed Alumni</p>
          </div></div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-3"><Users className="h-6 w-6 text-purple-500" /><div>
            <p className="text-2xl font-bold text-purple-600">{mentors}</p>
            <p className="text-xs text-muted-foreground">Willing to Mentor</p>
          </div></div>
        </CardContent></Card>
      </div>

      {/* Overdue check-ins alert */}
      {alumniNeedingCheckin.length > 0 && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-800">
                {alumniNeedingCheckin.length} alumni overdue for a check-in
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {alumniNeedingCheckin.slice(0, 5).map((a: any) => (
                  <Badge key={a.id} variant="outline" className="border-amber-400">
                    {(a.residents as any)?.name ?? "Unknown"}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="directory">
        <TabsList>
          <TabsTrigger value="directory">Directory ({alumni.length})</TabsTrigger>
          <TabsTrigger value="checkins">Check-Ins ({checkins.length})</TabsTrigger>
          <TabsTrigger value="mentorship">Mentorship ({pairs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="mt-4 space-y-3">
          <div className="flex gap-3">
            <Input placeholder="Search alumni..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="max-w-xs" />
            <Select value={filterMentor} onValueChange={setFilterMentor}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Alumni</SelectItem>
                <SelectItem value="mentor">Mentors Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filteredAlumni.length === 0 ? (
            <Card><CardContent className="text-center py-10 text-muted-foreground">
              No alumni found. Add discharged residents to the alumni network.
            </CardContent></Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {filteredAlumni.map((a: any) => {
                const lastCI = checkins.filter((c: any) => c.alumni_id === a.id)[0];
                const dischargeDate = a.residents?.move_out_date ? parseISO(a.residents.move_out_date) : null;
                const daysSince = dischargeDate ? differenceInDays(new Date(), dischargeDate) : null;
                return (
                  <Card key={a.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{(a.residents as any)?.name ?? "Unknown"}</p>
                        <div className="flex gap-1">
                          {a.willing_to_mentor && <Badge variant="secondary">Mentor</Badge>}
                          {!a.opt_in && <Badge variant="outline">Opted Out</Badge>}
                        </div>
                      </div>
                      {a.current_city && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Home className="h-3.5 w-3.5" />{a.current_city}
                        </p>
                      )}
                      {a.contact_phone && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />{a.contact_phone}
                        </p>
                      )}
                      {daysSince !== null && (
                        <p className="text-xs text-muted-foreground">{daysSince} days since discharge</p>
                      )}
                      {lastCI && (
                        <p className="text-xs text-muted-foreground">
                          Last check-in: {lastCI.checkin_date} via {lastCI.method}
                          {lastCI.sobriety_confirmed ? " · ✓ Sober" : " · ✗ Not confirmed"}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checkins" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Check-In History</CardTitle></CardHeader>
            <CardContent>
              {checkins.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No check-ins recorded yet.</p>
              ) : (
                <div className="divide-y max-h-96 overflow-y-auto">
                  {checkins.slice(0, 30).map((c: any) => {
                    const a = alumni.find((x: any) => x.id === c.alumni_id);
                    return (
                      <div key={c.id} className="py-3 flex items-start justify-between">
                        <div>
                          <p className="font-medium">{(a?.residents as any)?.name ?? "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {c.checkin_date} · {c.method} · {c.employment_status ?? "—"} employment
                          </p>
                          {c.notes && <p className="text-xs text-muted-foreground mt-0.5">{c.notes}</p>}
                        </div>
                        <Badge variant={c.sobriety_confirmed ? "default" : "destructive"}>
                          {c.sobriety_confirmed ? "Sober" : "Not Confirmed"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mentorship" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Mentorship Pairs</CardTitle>
              <CardDescription>Alumni mentoring current residents</CardDescription>
            </CardHeader>
            <CardContent>
              {pairs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No active pairs. Click "Match Mentor" to pair an alumni with a resident.
                </p>
              ) : (
                <div className="divide-y">
                  {pairs.map((p: any) => (
                    <div key={p.id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {(p.alumni_profiles as any)?.residents?.name ?? "Alumni"} →{" "}
                          {(p.residents as any)?.name ?? "Resident"}
                        </p>
                        <p className="text-xs text-muted-foreground">Started {p.start_date}</p>
                        {p.notes && <p className="text-xs text-muted-foreground">{p.notes}</p>}
                      </div>
                      <Badge variant="default">Active</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
