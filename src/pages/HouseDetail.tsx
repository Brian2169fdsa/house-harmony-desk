import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function HouseDetail() {
  const { id } = useParams<{ id: string }>();

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

  const { data: rooms } = useQuery({
    queryKey: ["rooms", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("house_id", id);
      if (error) throw error;
      return data;
    },
  });

  const { data: beds } = useQuery({
    queryKey: ["beds", id],
    queryFn: async () => {
      if (!id) return [];
      // First get all rooms for this house
      const { data: houseRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("house_id", id);
      
      if (!houseRooms || houseRooms.length === 0) return [];
      
      const roomIds = houseRooms.map(r => r.id);
      
      // Then get beds for those rooms
      const { data, error } = await supabase
        .from("beds")
        .select(`
          *,
          room:rooms!inner(name),
          resident:residents(name)
        `)
        .in("room_id", roomIds);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: residents } = useQuery({
    queryKey: ["house-residents", id],
    queryFn: async () => {
      if (!id) return [];
      
      // First get all rooms for this house
      const { data: houseRooms } = await supabase
        .from("rooms")
        .select("id")
        .eq("house_id", id);
      
      if (!houseRooms || houseRooms.length === 0) return [];
      
      const roomIds = houseRooms.map(r => r.id);
      
      // Get beds for those rooms
      const { data: houseBeds } = await supabase
        .from("beds")
        .select("id")
        .in("room_id", roomIds);
      
      if (!houseBeds || houseBeds.length === 0) return [];
      
      const bedIds = houseBeds.map(b => b.id);
      
      // Get residents assigned to those beds
      const { data, error } = await supabase
        .from("residents")
        .select(`
          *,
          bed:beds!inner(
            label,
            room:rooms!inner(name)
          )
        `)
        .in("bed_id", bedIds);
      if (error) throw error;
      return data || [];
    },
  });

  if (!house) return <div className="text-center py-12">Loading...</div>;

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

        <TabsContent value="rooms" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Room
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rooms?.map((room) => (
              <Card key={room.id}>
                <CardHeader>
                  <CardTitle>{room.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {beds?.filter((b) => b.room_id === room.id).length || 0} beds
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="beds" className="space-y-4">
          <div className="flex justify-end">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Bed
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {beds?.map((bed) => (
              <Card key={bed.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {Array.isArray(bed.room) ? bed.room[0]?.name : bed.room?.name} - {bed.label}
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
                  {bed.resident && (
                    <p className="text-sm text-muted-foreground">
                      Assigned to: {(bed.resident as any).name || 'Unknown'}
                    </p>
                  )}
                  <div className="flex gap-2">
                    {bed.status === "available" && (
                      <>
                        <Button size="sm" variant="outline">
                          Assign
                        </Button>
                        <Button size="sm" variant="outline">
                          Hold
                        </Button>
                      </>
                    )}
                    {bed.status === "held" && (
                      <Button size="sm" variant="outline">
                        Release
                      </Button>
                    )}
                    {bed.status === "occupied" && (
                      <Button size="sm" variant="outline">
                        Unassign
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Residents</CardTitle>
            </CardHeader>
            <CardContent>
              {residents && residents.length > 0 ? (
                <div className="space-y-4">
                  {residents.map((resident) => (
                    <div
                      key={resident.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <p className="font-medium">{resident.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {resident.bed && !Array.isArray(resident.bed) && resident.bed.room && !Array.isArray(resident.bed.room) 
                            ? `${resident.bed.room.name} - ${resident.bed.label}` 
                            : 'No bed assigned'}
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
                  ))}
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
    </div>
  );
}
