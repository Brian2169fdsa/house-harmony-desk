import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const residents = [
  {
    id: 1,
    name: "John Doe",
    room: "1A",
    leaseStart: "2024-01-15",
    leaseEnd: "2024-07-15",
    balance: "$0",
    status: "Active",
  },
  {
    id: 2,
    name: "Jane Smith",
    room: "3B",
    leaseStart: "2024-02-01",
    leaseEnd: "2024-08-01",
    balance: "$0",
    status: "Active",
  },
  {
    id: 3,
    name: "Mike Johnson",
    room: "2A",
    leaseStart: "2023-11-10",
    leaseEnd: "2024-05-10",
    balance: "$1,200",
    status: "Active",
  },
  {
    id: 4,
    name: "Sarah Williams",
    room: "4C",
    leaseStart: "2024-01-20",
    leaseEnd: "2024-07-20",
    balance: "$2,400",
    status: "Past Due",
  },
  {
    id: 5,
    name: "Tom Brown",
    room: "1B",
    leaseStart: "2024-03-01",
    leaseEnd: "2024-09-01",
    balance: "$600",
    status: "Active",
  },
  {
    id: 6,
    name: "Lisa Davis",
    room: "2C",
    leaseStart: "2024-02-15",
    leaseEnd: "2024-08-15",
    balance: "$0",
    status: "Active",
  },
];

export default function Residents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Residents</h1>
          <p className="text-muted-foreground">
            Manage resident profiles and leases
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Resident
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Residents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Room/Bed</TableHead>
                <TableHead>Lease Start</TableHead>
                <TableHead>Lease End</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residents.map((resident) => (
                <TableRow key={resident.id}>
                  <TableCell className="font-medium">{resident.name}</TableCell>
                  <TableCell>{resident.room}</TableCell>
                  <TableCell>{resident.leaseStart}</TableCell>
                  <TableCell>{resident.leaseEnd}</TableCell>
                  <TableCell>
                    <span
                      className={
                        resident.balance !== "$0"
                          ? "text-destructive font-semibold"
                          : ""
                      }
                    >
                      {resident.balance}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        resident.status === "Active" ? "default" : "destructive"
                      }
                    >
                      {resident.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Send Message</DropdownMenuItem>
                        <DropdownMenuItem>Upload Document</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
