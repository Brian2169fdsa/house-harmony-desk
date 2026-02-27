import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Houses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const { data: houses = [], isLoading } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("houses")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: bedCounts = {} } = useQuery({
    queryKey: ["house-bed-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beds")
        .select("room_id, rooms!inner(house_id)");
      if (error) return {};
      const counts: Record<string, number> = {};
      for (const bed of data ?? []) {
        const houseId = (bed.rooms as any)?.house_id;
        if (houseId) counts[houseId] = (counts[houseId] ?? 0) + 1;
      }
      return counts;
    },
  });

  const addHouse = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("houses").insert({
        name: name.trim(),
        address: address.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      toast.success("House added");
      setDialogOpen(false);
      setName("");
      setAddress("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim()) return;
    addHouse.mutate();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Houses</h1>
          <p className="text-muted-foreground">Manage facilities and inventory</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add House
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading houses…</p>
      ) : houses.length === 0 ? (
        <p className="text-muted-foreground">No houses yet. Add one to get started.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {houses.map((house) => (
            <Card
              key={house.id}
              className="hover:shadow-lg transition-shadow p-4 relative"
              tabIndex={0}
            >
              <button
                className="absolute top-4 right-4 p-1 rounded hover:bg-accent opacity-30 cursor-not-allowed"
                disabled
                aria-label="More options"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>

              <CardHeader className="p-0 space-y-2">
                <CardTitle className="text-lg">{house.name}</CardTitle>
                <p className="text-sm text-muted-foreground truncate">
                  {house.address}
                </p>
              </CardHeader>

              <CardContent className="p-0 pt-4 space-y-3">
                <div className="space-y-1 text-sm">
                  <p className="text-foreground">
                    <span className="font-medium">Beds:</span>{" "}
                    {bedCounts[house.id] ?? 0}
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-medium">Manager:</span> —
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => navigate(`/houses/${house.id}`)}
                >
                  Open House
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add House</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="house-name">Name</Label>
              <Input
                id="house-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sonoran Ridge House"
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="house-address">Address</Label>
              <Input
                id="house-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="1234 E Main St, Phoenix, AZ 85001"
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addHouse.isPending}>
                {addHouse.isPending ? "Adding…" : "Add House"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
