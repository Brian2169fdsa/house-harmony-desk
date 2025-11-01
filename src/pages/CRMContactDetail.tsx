import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";

export default function CRMContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contact, isLoading } = useQuery({
    queryKey: ["crm-contact", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_contacts")
        .select("*, crm_organizations(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: activities } = useQuery({
    queryKey: ["crm-activities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_activities")
        .select("*")
        .eq("contact_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate("/crm")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to CRM
        </Button>
        <p className="text-center text-muted-foreground">Contact not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate("/crm")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to CRM
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {contact.first_name} {contact.last_name}
          </h1>
          <div className="flex gap-2 mt-2">
            <Badge>{contact.segment.replace("_", " ")}</Badge>
            <Badge variant={contact.status === "active" ? "default" : "secondary"}>
              {contact.status}
            </Badge>
          </div>
        </div>
        <Button>Edit Contact</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground">{contact.email || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Phone</p>
              <p className="text-sm text-muted-foreground">{contact.phone || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Role</p>
              <p className="text-sm text-muted-foreground">{contact.role || "—"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Source</p>
              <p className="text-sm text-muted-foreground">{contact.source || "—"}</p>
            </div>
            {contact.tags && contact.tags.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Tags</p>
                <div className="flex gap-1 flex-wrap">
                  {contact.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {activities && activities.length > 0 ? (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div key={activity.id} className="border-l-2 pl-3 pb-2">
                    <p className="font-medium text-sm">{activity.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.type} · {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                    {activity.body && (
                      <p className="text-sm text-muted-foreground mt-1">{activity.body}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No activities yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
