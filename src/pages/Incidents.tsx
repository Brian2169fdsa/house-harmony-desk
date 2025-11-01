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

const incidents = [
  {
    id: 1,
    type: "Maintenance",
    resident: "John Doe",
    description: "Broken window in common area",
    severity: "Medium",
    reportedDate: "2024-04-28",
    status: "In Progress",
  },
  {
    id: 2,
    type: "Policy Violation",
    resident: "Sarah Williams",
    description: "Noise complaint from neighbors",
    severity: "Low",
    reportedDate: "2024-04-27",
    status: "Resolved",
  },
  {
    id: 3,
    type: "Emergency",
    resident: "Mike Johnson",
    description: "Water leak in bathroom",
    severity: "High",
    reportedDate: "2024-04-29",
    status: "Open",
  },
];

export default function Incidents() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Incidents</h1>
          <p className="text-muted-foreground">
            Track and manage facility incidents
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Log Incident
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Open Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              1 high priority
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Resolved This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              Average 2.3 days to resolve
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Maintenance Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              Pending contractor
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="font-medium">{incident.type}</TableCell>
                  <TableCell>{incident.resident}</TableCell>
                  <TableCell>{incident.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        incident.severity === "High"
                          ? "destructive"
                          : incident.severity === "Medium"
                          ? "secondary"
                          : "default"
                      }
                    >
                      {incident.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>{incident.reportedDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        incident.status === "Resolved"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {incident.status}
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
