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

const chores = [
  {
    id: 1,
    title: "Kitchen Cleaning",
    assignee: "John Doe",
    dueDate: "2024-05-02",
    status: "Pending",
    frequency: "Weekly",
  },
  {
    id: 2,
    title: "Bathroom Maintenance",
    assignee: "Jane Smith",
    dueDate: "2024-05-01",
    status: "Completed",
    frequency: "Weekly",
  },
  {
    id: 3,
    title: "Living Room Vacuum",
    assignee: "Mike Johnson",
    dueDate: "2024-05-03",
    status: "Pending",
    frequency: "Bi-weekly",
  },
  {
    id: 4,
    title: "Trash Collection",
    assignee: "Tom Brown",
    dueDate: "2024-05-01",
    status: "Overdue",
    frequency: "Daily",
  },
  {
    id: 5,
    title: "Yard Work",
    assignee: "Lisa Davis",
    dueDate: "2024-05-04",
    status: "Pending",
    frequency: "Monthly",
  },
];

export default function Chores() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Chores & Maintenance</h1>
          <p className="text-muted-foreground">
            Manage household responsibilities and maintenance tasks
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Task
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {chores.map((chore) => (
                <TableRow key={chore.id}>
                  <TableCell className="font-medium">{chore.title}</TableCell>
                  <TableCell>{chore.assignee}</TableCell>
                  <TableCell>{chore.dueDate}</TableCell>
                  <TableCell>{chore.frequency}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        chore.status === "Completed"
                          ? "default"
                          : chore.status === "Overdue"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {chore.status}
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
