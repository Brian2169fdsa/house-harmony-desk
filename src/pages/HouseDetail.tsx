import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  // ─── Dialog state ────────────────────────────────────────────────────────
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeBedId, setActiveBedId] = useState<string | null>(null);

  // Form fields
  const [roomName, setRoomName] = useState("");
  const [bedLabel, setBedLabel] = useState("");
  const [bedRoomId, setBedRoomId] = useState("");
  const [assignResidentId, setAssignResidentId] = useState("");

  // ─── Queries ─────────────────────────────────────────────────────────────
  const { data: house } = useQuery({
    queryKey: ["house", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("house_id", id)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: beds = [] } = useQuery({
    queryKey: ["beds", id],
    queryFn: async () => {
      if (!id) return [];
      const { data: houseRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("house_id", id);
      if (!houseRooms?.length) return [];
      const roomIds = houseRooms.map((r) => r.id);
      const { data, error } = await supabase
        .from("beds")
        .select(`*, room:rooms!inner(name), resident:residents(name, id)`)
        .in("room_id", roomIds)
        .order("label");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["house-residents", id],
    queryFn: async () => {
      if (!id) return [];
      const { data: houseRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("house_id", id);
      if (!houseRooms?.length) return [];
      const roomIds = houseRooms.map((r) => r.id);
      const { data: houseBeds } = await supabase
        .from("beds")
        .select("id")
        .in("room_id", roomIds);
      if (!houseBeds?.length) return [];
      const bedIds = houseBeds.map((b) => b.id);
      const { data, error } = await supabase
        .from("residents")
        .select(`*, bed:beds!inner(label, room:rooms!inner(name))`)
        .in("bed_id", bedIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Unassigned residents (no bed_id) for the Assign dialog
  const { data: unassignedResidents = [] } = useQuery({
    queryKey: ["unassigned-residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .is("bed_id", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // ─── Helper to invalidate all house queries ───────────────────────────────
  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["rooms", id] });
    queryClient.invalidateQueries({ queryKey: ["beds", id] });
    queryClient.invalidateQueries({ queryKey: ["house-residents", id] });
    queryClient.invalidateQueries({ queryKey: ["unassigned-residents"] });
  }

  // ─── Mutations ────────────────────────────────────────────────────────────
  const addRoom = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("rooms")
        .insert({ house_id: id, name: roomName.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Room added");
      setAddRoomOpen(false);
      setRoomName("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const addBed = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("beds")
        .insert({ room_id: bedRoomId, label: bedLabel.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Bed added");
      setAddBedOpen(false);
      setBedLabel("");
      setBedRoomId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const assignBed = useMutation({
    mutationFn: async () => {
      // Update resident's bed_id
      const { error: rErr } = await supabase
        .from("residents")
        .update({ bed_id: activeBedId })
        .eq("id", assignResidentId);
      if (rErr) throw rErr;
      // Mark bed as occupied
      const { error: bErr } = await supabase
        .from("beds")
        .update({ status: "occupied" })
        .eq("id", activeBedId);
      if (bErr) throw bErr;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Resident assigned");
      setAssignOpen(false);
      setAssignResidentId("");
      setActiveBedId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const holdBed = useMutation({
    mutationFn: async (bedId: string) => {
      const { error } = await supabase
        .from("beds")
        .update({ status: "held" })
        .eq("id", bedId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Bed held");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const releaseBed = useMutation({
    mutationFn: async (bedId: string) => {
      const { error } = await supabase
        .from("beds")
        .update({ status: "available" })
        .eq("id", bedId);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Bed released");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unassignBed = useMutation({
    mutationFn: async (bedId: string) => {
      // Clear resident's bed_id
      const { error: rErr } = await supabase
        .from("residents")
        .update({ bed_id: null })
        .eq("bed_id", bedId);
      if (rErr) throw rErr;
      // Mark bed available
      const { error: bErr } = await supabase
        .from("beds")
        .update({ status: "available" })
        .eq("id", bedId);
      if (bErr) throw bErr;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Resident unassigned");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ─── Handlers ─────────────────────────────────────────────────────────────
  function openAssign(bedId: string) {
    setActiveBedId(bedId);
    setAssignResidentId("");
    setAssignOpen(true);
  }

  if (!house) return <div className="text-center py-12">Loading…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">{house.name}</h1>
        <p className="text-muted-foreground">{house.address}</p>
      </div>

      <Tabs defaultValue="rooms" className="w-full">
        <TabsList>
          <TabsTrigger value="rooms">Rooms</TabsTrigger>
          <TabsTrigger value="beds">Beds</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>

        {/* ── Rooms Tab ─────────────────────────────────────────────────── */}
        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddRoomOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
          {rooms.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No rooms yet. Add one to get started.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <Card key={room.id}>
                  <CardHeader>
                    <CardTitle>{room.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {beds.filter((b) => b.room_id === room.id).length} beds
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Beds Tab ──────────────────────────────────────────────────── */}
        <TabsContent value="beds" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setAddBedOpen(true)} disabled={rooms.length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              Add Bed
            </Button>
          </div>
          {beds.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No beds yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {beds.map((bed) => {
                const roomName =
                  Array.isArray(bed.room)
                    ? bed.room[0]?.name
                    : (bed.room as any)?.name;
                const residentRow = Array.isArray(bed.resident)
                  ? bed.resident[0]
                  : (bed.resident as any);
                return (
                  <Card key={bed.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {roomName} — {bed.label}
                        </CardTitle>
                        <Badge
                          variant={
                            bed.status === "available"
                              ? "default"
                              : bed.status === "occupied"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {bed.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {residentRow && (
                        <p className="text-sm text-muted-foreground">
                          Assigned to: {residentRow.name}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {bed.status === "available" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openAssign(bed.id)}
                            >
                              Assign
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => holdBed.mutate(bed.id)}
                            >
                              Hold
                            </Button>
                          </>
                        )}
                        {bed.status === "held" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => releaseBed.mutate(bed.id)}
                          >
                            Release
                          </Button>
                        )}
                        {bed.status === "occupied" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unassignBed.mutate(bed.id)}
                          >
                            Unassign
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Roster Tab ────────────────────────────────────────────────── */}
        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Residents</CardTitle>
            </CardHeader>
            <CardContent>
              {residents.length > 0 ? (
                <div className="space-y-4">
                  {residents.map((resident) => {
                    const bed = resident.bed as any;
                    const room = bed?.room;
                    return (
                      <div
                        key={resident.id}
                        className="flex items-center justify-between border-b pb-4 last:border-0"
                      >
                        <div>
                          <p className="font-medium">{resident.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {room && bed
                              ? `${room.name} — ${bed.label}`
                              : "No bed assigned"}
                          </p>
                        </div>
                        <Badge
                          variant={
                            resident.status === "Active" ? "default" : "destructive"
                          }
                        >
                          {resident.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No residents assigned
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Add Room Dialog ─────────────────────────────────────────────── */}
      <Dialog open={addRoomOpen} onOpenChange={setAddRoomOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!roomName.trim()) return;
              addRoom.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="room-name">Room Name</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Room 1A"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddRoomOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addRoom.isPending}>
                {addRoom.isPending ? "Adding…" : "Add Room"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Add Bed Dialog ──────────────────────────────────────────────── */}
      <Dialog open={addBedOpen} onOpenChange={setAddBedOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Bed</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!bedLabel.trim() || !bedRoomId) return;
              addBed.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="bed-room">Room</Label>
              <Select value={bedRoomId} onValueChange={setBedRoomId} required>
                <SelectTrigger id="bed-room">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="bed-label">Bed Label</Label>
              <Input
                id="bed-label"
                value={bedLabel}
                onChange={(e) => setBedLabel(e.target.value)}
                placeholder="Bed A"
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddBedOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addBed.isPending}>
                {addBed.isPending ? "Adding…" : "Add Bed"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Assign Resident Dialog ──────────────────────────────────────── */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Resident to Bed</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!assignResidentId) return;
              assignBed.mutate();
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <Label htmlFor="assign-resident">Resident</Label>
              {unassignedResidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No unassigned residents available.
                </p>
              ) : (
                <Select
                  value={assignResidentId}
                  onValueChange={setAssignResidentId}
                >
                  <SelectTrigger id="assign-resident">
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedResidents.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAssignOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  assignBed.isPending ||
                  !assignResidentId ||
                  unassignedResidents.length === 0
                }
              >
                {assignBed.isPending ? "Assigning…" : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
