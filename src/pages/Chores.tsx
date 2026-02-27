import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Chores() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    house_id: "",
    title: "",
    description: "",
    assigned_to: "",
    due_date: "",
    frequency: "once",
  });

  const { data: chores = [] } = useQuery({
    queryKey: ["chores"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chores")
        .select("*, residents(name), houses(name)")
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: houses = [] } = useQuery({
    queryKey: ["houses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("houses").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const { data: residents = [] } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .eq("status", "Active");
      if (error) throw error;
      return data;
    },
  });

  const createChore = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await supabase.from("chores").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      toast({ title: "Task created" });
      setDialogOpen(false);
      setFormData({
        house_id: "",
        title: "",
        description: "",
        assigned_to: "",
        due_date: "",
        frequency: "once",
      });
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("chores")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chores"] });
      toast({ title: "Status updated" });
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    createChore.mutate({
      house_id: formData.house_id || null,
      title: formData.title,
      description: formData.description || null,
      assigned_to: formData.assigned_to || null,
      due_date: formData.due_date || null,
      frequency: formData.frequency,
      status: "pending",
    });
  };

  const statusVariant = (s: string) => {
    if (s === "completed") return "default" as const;
    if (s === "overdue") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Chores & Maintenance
          </h1>
          <p className="text-muted-foreground">
            Manage household responsibilities and maintenance tasks
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Task title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div>
                <Label>House</Label>
                <Select
                  value={formData.house_id}
                  onValueChange={(v) =>
                    setFormData({ ...formData, house_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select house" />
                  </SelectTrigger>
                  <SelectContent>
                    {(houses as any[]).map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Assign To</Label>
                <Select
                  value={formData.assigned_to}
                  onValueChange={(v) =>
                    setFormData({ ...formData, assigned_to: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resident" />
                  </SelectTrigger>
                  <SelectContent>
                    {(residents as any[]).map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) =>
                    setFormData({ ...formData, due_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(v) =>
                    setFormData({ ...formData, frequency: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="once">Once</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={createChore.isPending}
              >
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {chores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No tasks yet
            </p>
          ) : (
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
                {(chores as any[]).map((chore) => (
                  <TableRow key={chore.id}>
                    <TableCell className="font-medium">{chore.title}</TableCell>
                    <TableCell>
                      {chore.residents?.name ?? "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {chore.due_date
                        ? format(new Date(chore.due_date), "MMM d, yyyy")
                        : "—"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {chore.frequency}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={chore.status}
                        onValueChange={(v) =>
                          updateStatus.mutate({ id: chore.id, status: v })
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
