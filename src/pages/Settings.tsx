import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Configure your facility and system preferences
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Facility Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="facility-name">Facility Name</Label>
              <Input id="facility-name" placeholder="Phoenix Recovery House" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" placeholder="123 Main St, Phoenix, AZ" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="total-beds">Total Beds</Label>
              <Input id="total-beds" type="number" placeholder="8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="rent-amount">Default Rent Amount</Label>
              <Input id="rent-amount" type="number" placeholder="800" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="deposit-cap">Deposit Cap</Label>
              <Input id="deposit-cap" type="number" placeholder="1600" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-generate Monthly Invoices</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically create invoices on the 1st of each month
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Payment Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Send reminders 3 days before due date
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Incident Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Notify staff immediately when incidents are logged
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Daily Activity Summary</Label>
                <p className="text-sm text-muted-foreground">
                  Receive daily email with facility activity
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}
