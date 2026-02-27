import { useState } from "react";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Download, DollarSign } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentAgentDashboard } from "@/components/payments/PaymentAgentDashboard";

type InvoiceStatus = "pending" | "paid" | "overdue" | "partial" | "void";

interface Invoice {
  id: string;
  resident_id: string | null;
  house_id: string | null;
  amount_cents: number;
  due_date: string;
  paid_date: string | null;
  status: InvoiceStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
  residents?: { name: string } | null;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function statusVariant(status: InvoiceStatus) {
  switch (status) {
    case "paid": return "default" as const;
    case "overdue": return "destructive" as const;
    case "void": return "secondary" as const;
    default: return "secondary" as const;
  }
}

export default function Payments() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState<Invoice | null>(null);
  const { toast } = useToast();

  const paymentAgentEnabled = typeof window !== "undefined" && localStorage.getItem("ENABLE_PAYMENT_AGENT") === "true";
  const queryClient = useQueryClient();

  // Form state for creating invoice
  const [form, setForm] = useState({
    resident_id: "",
    amount_dollars: "",
    due_date: "",
    description: "",
    status: "pending" as InvoiceStatus,
  });

  // Mark as paid form state
  const [paidForm, setPaidForm] = useState({
    payment_method: "",
    reference_number: "",
  });

  // Fetch all invoices with resident info
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, residents(name)")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invoice[];
    },
  });

  // Fetch residents for the create dialog dropdown
  const { data: residents = [] } = useQuery({
    queryKey: ["residents-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Calculate KPIs
  const outstanding = invoices
    .filter((i) => i.status === "pending" || i.status === "overdue" || i.status === "partial")
    .reduce((sum, i) => sum + i.amount_cents, 0);
  const outstandingCount = invoices.filter(
    (i) => i.status === "pending" || i.status === "overdue" || i.status === "partial"
  ).length;

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  const collectedThisMonth = invoices
    .filter((i) => i.status === "paid" && i.paid_date && new Date(i.paid_date) >= thisMonthStart)
    .reduce((sum, i) => sum + i.amount_cents, 0);
  const collectedCount = invoices.filter(
    (i) => i.status === "paid" && i.paid_date && new Date(i.paid_date) >= thisMonthStart
  ).length;

  const totalInvoices = invoices.length;
  const paidInvoices = invoices.filter((i) => i.status === "paid").length;
  const successRate =
    totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

  // Create invoice mutation
  const createInvoice = useMutation({
    mutationFn: async () => {
      const amountCents = Math.round(parseFloat(form.amount_dollars) * 100);
      const { error } = await supabase.from("invoices").insert({
        resident_id: form.resident_id || null,
        amount_cents: amountCents,
        due_date: form.due_date,
        description: form.description || null,
        status: form.status,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowCreateDialog(false);
      setForm({ resident_id: "", amount_dollars: "", due_date: "", description: "", status: "pending" });
      toast({ title: "Invoice created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Error creating invoice", description: err.message, variant: "destructive" });
    },
  });

  // Mark as paid mutation
  const markAsPaid = useMutation({
    mutationFn: async (invoice: Invoice) => {
      const today = new Date().toISOString().split("T")[0];
      // Update invoice status
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({ status: "paid", paid_date: today })
        .eq("id", invoice.id);
      if (invoiceError) throw invoiceError;
      // Record payment event
      const { error: paymentError } = await supabase.from("payments").insert({
        invoice_id: invoice.id,
        amount_cents: invoice.amount_cents,
        payment_method: paidForm.payment_method || null,
        reference_number: paidForm.reference_number || null,
        paid_at: new Date().toISOString(),
      });
      if (paymentError) throw paymentError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setShowMarkPaidDialog(null);
      setPaidForm({ payment_method: "", reference_number: "" });
      toast({ title: "Invoice marked as paid" });
    },
    onError: (err: Error) => {
      toast({ title: "Error marking invoice as paid", description: err.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            Manage invoices and payment collection
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      {paymentAgentEnabled && <PaymentAgentDashboard />}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(outstanding)}</div>
            <p className="text-xs text-muted-foreground">
              Across {outstandingCount} {outstandingCount === 1 ? "invoice" : "invoices"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Collected This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(collectedThisMonth)}</div>
            <p className="text-xs text-muted-foreground">
              {collectedCount} {collectedCount === 1 ? "payment" : "payments"} received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Payment Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">
              {paidInvoices} of {totalInvoices} invoices paid
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading invoices...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resident</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No invoices yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.residents?.name ?? "—"}
                      </TableCell>
                      <TableCell>{formatCents(invoice.amount_cents)}</TableCell>
                      <TableCell>{invoice.due_date}</TableCell>
                      <TableCell>{invoice.paid_date ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {invoice.description ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.status !== "paid" && invoice.status !== "void" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMarkPaidDialog(invoice)}
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Mark Paid
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Resident</Label>
              <Select
                value={form.resident_id}
                onValueChange={(v) => setForm({ ...form, resident_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select resident (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {residents.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="800.00"
                value={form.amount_dollars}
                onChange={(e) => setForm({ ...form, amount_dollars: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Monthly rent, etc."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v as InvoiceStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createInvoice.mutate()}
              disabled={createInvoice.isPending || !form.amount_dollars || !form.due_date}
            >
              {createInvoice.isPending ? "Creating..." : "Create Invoice"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Paid Dialog */}
      <Dialog open={!!showMarkPaidDialog} onOpenChange={(open) => { if (!open) setShowMarkPaidDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          {showMarkPaidDialog && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Recording payment of {formatCents(showMarkPaidDialog.amount_cents)} for{" "}
                {showMarkPaidDialog.residents?.name ?? "this invoice"}.
              </p>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select
                  value={paidForm.payment_method}
                  onValueChange={(v) => setPaidForm({ ...paidForm, payment_method: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="venmo">Venmo</SelectItem>
                    <SelectItem value="zelle">Zelle</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  placeholder="Check #, transaction ID, etc."
                  value={paidForm.reference_number}
                  onChange={(e) => setPaidForm({ ...paidForm, reference_number: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarkPaidDialog(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => showMarkPaidDialog && markAsPaid.mutate(showMarkPaidDialog)}
              disabled={markAsPaid.isPending}
            >
              {markAsPaid.isPending ? "Saving..." : "Mark as Paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
