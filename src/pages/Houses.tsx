import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Houses() {
  const navigate = useNavigate();

  const { data: houses, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Houses</h1>
          <p className="text-muted-foreground">Manage facilities and inventory</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add House
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : houses && houses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {houses.map((house) => (
            <Card
              key={house.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/houses/${house.id}`)}
            >
              <CardHeader>
                <CardTitle>{house.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{house.address}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No houses yet</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First House
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
