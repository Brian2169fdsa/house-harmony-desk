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
import { Plus, Download } from "lucide-react";

const invoices = [
  {
    id: "INV-001",
    resident: "John Doe",
    amount: "$800",
    dueDate: "2024-05-01",
    status: "Paid",
    paidDate: "2024-04-28",
  },
  {
    id: "INV-002",
    resident: "Jane Smith",
    amount: "$800",
    dueDate: "2024-05-01",
    status: "Paid",
    paidDate: "2024-05-01",
  },
  {
    id: "INV-003",
    resident: "Mike Johnson",
    amount: "$800",
    dueDate: "2024-05-01",
    status: "Overdue",
    paidDate: null,
  },
  {
    id: "INV-004",
    resident: "Sarah Williams",
    amount: "$800",
    dueDate: "2024-04-01",
    status: "Overdue",
    paidDate: null,
  },
  {
    id: "INV-005",
    resident: "Tom Brown",
    amount: "$800",
    dueDate: "2024-05-01",
    status: "Pending",
    paidDate: null,
  },
  {
    id: "INV-006",
    resident: "Lisa Davis",
    amount: "$800",
    dueDate: "2024-05-01",
    status: "Paid",
    paidDate: "2024-04-30",
  },
];

export default function Payments() {
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,200</div>
            <p className="text-xs text-muted-foreground">
              Across 3 residents
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Collected This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,800</div>
            <p className="text-xs text-muted-foreground">
              6 payments received
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Payment Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Resident</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{invoice.resident}</TableCell>
                  <TableCell>{invoice.amount}</TableCell>
                  <TableCell>{invoice.dueDate}</TableCell>
                  <TableCell>{invoice.paidDate || "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        invoice.status === "Paid"
                          ? "default"
                          : invoice.status === "Overdue"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {invoice.status}
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
