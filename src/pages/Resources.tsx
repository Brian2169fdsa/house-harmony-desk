import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ExternalLink, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Resources() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    url: "",
    phone: "",
    address: "",
  });

  const { data: resources = [] } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resources")
        .select("*")
        .eq("is_active", true)
        .order("category", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createResource = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { error } = await supabase.from("resources").insert([payload]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({ title: "Resource added" });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        category: "",
        url: "",
        phone: "",
        address: "",
      });
    },
    onError: () => {
      toast({ title: "Failed to add resource", variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.category.trim()) {
      toast({
        title: "Title and category are required",
        variant: "destructive",
      });
      return;
    }
    createResource.mutate({
      title: formData.title,
      description: formData.description || null,
      category: formData.category,
      url: formData.url || null,
      phone: formData.phone || null,
      address: formData.address || null,
      is_active: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Curate and share helpful resources with residents
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Resource</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Resource name"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Input
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  placeholder="e.g. AA Meetings, Employment, Mental Health"
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
                <Label>URL</Label>
                <Input
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Physical address"
                />
              </div>
              <Button
                onClick={handleSubmit}
                className="w-full"
                disabled={createResource.isPending}
              >
                Add Resource
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-8">
            No resources yet
          </div>
        ) : (
          (resources as any[]).map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      {resource.category}
                    </p>
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {resource.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {resource.description}
                  </p>
                )}
                {resource.phone && (
                  <p className="text-sm text-muted-foreground mb-2">
                    📞 {resource.phone}
                  </p>
                )}
                {resource.address && (
                  <p className="text-sm text-muted-foreground mb-4">
                    📍 {resource.address}
                  </p>
                )}
                {resource.url && (
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Resource
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
