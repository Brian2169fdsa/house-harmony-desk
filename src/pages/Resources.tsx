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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ExternalLink, Plus, MoreVertical, Pencil, Trash2, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Resources() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
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
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to add resource", variant: "destructive" });
    },
  });

  const updateResource = useMutation({
    mutationFn: async () => {
      if (!editingResource) return;
      const { error } = await supabase
        .from("resources")
        .update({
          title: formData.title.trim(),
          description: formData.description || null,
          category: formData.category.trim(),
          url: formData.url || null,
          phone: formData.phone || null,
          address: formData.address || null,
        })
        .eq("id", editingResource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({ title: "Resource updated" });
      closeDialog();
    },
    onError: () => {
      toast({ title: "Failed to update resource", variant: "destructive" });
    },
  });

  const deleteResource = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("resources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      toast({ title: "Resource deleted" });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: "Failed to delete resource", variant: "destructive" });
    },
  });

  function closeDialog() {
    setDialogOpen(false);
    setEditingResource(null);
    setFormData({ title: "", description: "", category: "", url: "", phone: "", address: "" });
  }

  function openEdit(resource: any) {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description ?? "",
      category: resource.category,
      url: resource.url ?? "",
      phone: resource.phone ?? "",
      address: resource.address ?? "",
    });
    setDialogOpen(true);
  }

  const handleSubmit = () => {
    if (!formData.title.trim() || !formData.category.trim()) {
      toast({
        title: "Title and category are required",
        variant: "destructive",
      });
      return;
    }
    if (editingResource) {
      updateResource.mutate();
    } else {
      createResource.mutate({
        title: formData.title,
        description: formData.description || null,
        category: formData.category,
        url: formData.url || null,
        phone: formData.phone || null,
        address: formData.address || null,
        is_active: true,
      });
    }
  };

  const isPending = createResource.isPending || updateResource.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Resources</h1>
          <p className="text-muted-foreground">
            Curate and share helpful resources with residents
          </p>
        </div>
        <Button onClick={() => { setEditingResource(null); setFormData({ title: "", description: "", category: "", url: "", phone: "", address: "" }); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resource
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-medium">No resources yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Add helpful resources for residents like AA meetings, employment services, or mental health contacts.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Resource
            </Button>
          </div>
        ) : (
          (resources as any[]).map((resource) => (
            <Card key={resource.id} className="relative">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="absolute top-4 right-4 p-1 rounded hover:bg-accent" aria-label="More options">
                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => openEdit(resource)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteTarget({ id: resource.id, title: resource.title })}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <CardHeader>
                <div className="flex items-start justify-between pr-8">
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

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add Resource"}</DialogTitle>
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
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving…" : editingResource ? "Save Changes" : "Add Resource"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteTarget?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this resource.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteResource.mutate(deleteTarget.id)}
            >
              {deleteResource.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
