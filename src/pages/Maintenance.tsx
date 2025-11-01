import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Phone, Wrench } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { NewRequestDialog } from "@/components/maintenance/NewRequestDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MaintenanceRequest = {
  id: string;
  house_id: string;
  service_id: string;
  vendor_id: string | null;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "complete" | "canceled";
  requested_for_at: string | null;
  contact_phone: string | null;
  created_at: string;
  houses: { name: string };
  services: { name: string; category: string };
  vendors: { name: string; phone: string; discount_pct: number } | null;
};

type Vendor = {
  id: string;
  name: string;
  phone: string;
  email: string;
  discount_pct: number;
  is_trusted: boolean;
  active: boolean;
};

export default function Maintenance() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["maintenance-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance_requests")
        .select(`
          *,
          houses(name),
          services(name, category),
          vendors(name, phone, discount_pct)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as MaintenanceRequest[];
    },
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data as Vendor[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "pending" | "in_progress" | "complete" | "canceled";
    }) => {
      const updates: any = { status };
      if (status === "complete") {
        updates.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("maintenance_requests")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-requests"] });
      toast({ title: "Request updated successfully" });
    },
    onError: () => {
      toast({
        title: "Error updating request",
        variant: "destructive",
      });
    },
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const scheduledRequests = requests.filter(
    (r) =>
      (r.status === "pending" || r.status === "in_progress") &&
      r.requested_for_at &&
      new Date(r.requested_for_at) > new Date()
  );
  const completedRequests = requests.filter((r) => r.status === "complete");

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const RequestCard = ({ request }: { request: MaintenanceRequest }) => (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{request.houses.name}</Badge>
              <Badge variant={getPriorityColor(request.priority)}>
                {request.priority}
              </Badge>
            </div>
            <CardTitle className="text-lg">{request.title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p className="font-medium">{request.services.name}</p>
          {request.description && (
            <p className="text-muted-foreground mt-1">{request.description}</p>
          )}
        </div>

        {request.vendors && (
          <div className="flex items-center gap-2 text-sm">
            <p className="font-medium">{request.vendors.name}</p>
            {request.vendors.discount_pct > 0 && (
              <Badge variant="secondary" className="text-xs">
                Trusted Partner · {request.vendors.discount_pct}% Discount
              </Badge>
            )}
          </div>
        )}

        {request.requested_for_at && (
          <p className="text-sm text-muted-foreground">
            Scheduled: {format(new Date(request.requested_for_at), "PPp")}
          </p>
        )}

        {request.contact_phone && (
          <a
            href={`tel:${request.contact_phone}`}
            className="flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <Phone className="h-4 w-4" />
            {request.contact_phone}
          </a>
        )}

        <div className="flex items-center gap-2">
          <Select
            value={request.status}
            onValueChange={(value: any) =>
              updateStatusMutation.mutate({ id: request.id, status: value })
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="complete">Complete</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>

          {request.status !== "complete" && (
            <Button
              size="sm"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: request.id,
                  status: "complete",
                })
              }
            >
              Mark Complete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const VendorsTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Vendor</TableHead>
          <TableHead>Services</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell className="font-medium">{vendor.name}</TableCell>
            <TableCell>-</TableCell>
            <TableCell>
              {vendor.discount_pct > 0 && (
                <Badge variant="secondary">{vendor.discount_pct}%</Badge>
              )}
            </TableCell>
            <TableCell>
              <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                {vendor.phone}
              </a>
            </TableCell>
            <TableCell>{vendor.email}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Maintenance</h1>
        </div>
        <Button onClick={() => setDialogOpen(true)}>New Request</Button>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({scheduledRequests.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4 mt-6">
          {pendingRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending requests
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-4 mt-6">
          {scheduledRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No scheduled requests
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {scheduledRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4 mt-6">
          {completedRequests.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No completed requests
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedRequests.map((request) => (
                <RequestCard key={request.id} request={request} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Trusted Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <VendorsTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
