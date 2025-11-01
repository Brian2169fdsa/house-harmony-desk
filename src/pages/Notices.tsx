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
import { Plus } from "lucide-react";

const notices = [
  {
    id: 1,
    type: "Rent Notice",
    resident: "Mike Johnson",
    servedDate: "2024-04-25",
    method: "Hand Delivered",
    deadline: "2024-05-05",
    status: "Active",
  },
  {
    id: 2,
    type: "House Rules Violation",
    resident: "Sarah Williams",
    servedDate: "2024-04-20",
    method: "Email",
    deadline: "2024-05-20",
    status: "Active",
  },
  {
    id: 3,
    type: "Lease Termination",
    resident: "Former Resident",
    servedDate: "2024-03-15",
    method: "Certified Mail",
    deadline: "2024-04-15",
    status: "Completed",
  },
];

export default function Notices() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notices</h1>
          <p className="text-muted-foreground">
            Generate and track formal resident notices
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Notice
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notice History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Served Date</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notices.map((notice) => (
                <TableRow key={notice.id}>
                  <TableCell className="font-medium">{notice.type}</TableCell>
                  <TableCell>{notice.resident}</TableCell>
                  <TableCell>{notice.servedDate}</TableCell>
                  <TableCell>{notice.method}</TableCell>
                  <TableCell>{notice.deadline}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        notice.status === "Active" ? "default" : "secondary"
                      }
                    >
                      {notice.status}
                    </Badge>
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
