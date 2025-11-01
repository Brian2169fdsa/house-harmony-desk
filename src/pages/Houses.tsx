import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MOCK_HOUSES = [
  {
    id: "1",
    name: "Sonoran Ridge House",
    address: "1717 E Camelback Rd, Phoenix, AZ 85016",
    capacity: 13,
  },
  {
    id: "2",
    name: "Copper Canyon House",
    address: "3333 E Indian School Rd, Phoenix, AZ 85018",
    capacity: 12,
  },
  {
    id: "3",
    name: "Camelback Commons House",
    address: "2000 E Highland Ave, Phoenix, AZ 85016",
    capacity: 12,
  },
  {
    id: "4",
    name: "Saguaro Grove House",
    address: "1120 W Thomas Rd, Phoenix, AZ 85013",
    capacity: 11,
  },
  {
    id: "5",
    name: "Papago Vista House",
    address: "5601 E Van Buren St, Phoenix, AZ 85008",
    capacity: 10,
  },
  {
    id: "6",
    name: "Ocotillo House",
    address: "4202 N 24th St, Phoenix, AZ 85016",
    capacity: 9,
  },
  {
    id: "7",
    name: "Cactus View House",
    address: "1500 W Bethany Home Rd, Phoenix, AZ 85015",
    capacity: 9,
  },
  {
    id: "8",
    name: "Desert Bloom House",
    address: "2401 N 7th St, Phoenix, AZ 85006",
    capacity: 8,
  },
];

export default function Houses() {
  const navigate = useNavigate();

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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {MOCK_HOUSES.map((house) => (
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
                  <span className="font-medium">Capacity:</span> {house.capacity} beds
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
    </div>
  );
}
