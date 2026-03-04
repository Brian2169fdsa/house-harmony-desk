import { useState, useRef } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, MoreHorizontal, FileText, Upload, Trash2, ExternalLink, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const BUCKET = "resident-documents";

export default function Residents() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [selectedResident, setSelectedResident] = useState<{ id: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", status: "Active", lease_start: "", lease_end: "" });
  const [addForm, setAddForm] = useState({ name: "", status: "Active", lease_start: "", lease_end: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: residents, isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select(`
          *,
          bed:beds(
            label,
            room:rooms(
              name,
              house:houses(name)
            )
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  function getRoomBed(resident: NonNullable<typeof residents>[number]) {
    const bed = (resident as any).bed;
    if (!bed) return "—";
    const room = bed.room;
    if (!room) return bed.label ?? "—";
    return `${room.name} · ${bed.label}`;
  }

  const { data: documents, refetch: refetchDocs } = useQuery({
    queryKey: ["resident-documents", selectedResident?.id],
    enabled: !!selectedResident?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("resident_documents")
        .select("*")
        .eq("resident_id", selectedResident!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const deleteDocMutation = useMutation({
    mutationFn: async ({ docId, filePath }: { docId: string; filePath: string }) => {
      await supabase.storage.from(BUCKET).remove([filePath]);
      const { error } = await supabase
        .from("resident_documents")
        .delete()
        .eq("id", docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resident-documents", selectedResident?.id] });
      toast.success("Document deleted");
    },
    onError: () => {
      toast.error("Failed to delete document");
    },
  });

  const updateResident = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("residents")
        .update({
          name: editForm.name.trim(),
          status: editForm.status,
          lease_start: editForm.lease_start || null,
          lease_end: editForm.lease_end || null,
        })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      toast.success("Resident updated");
      setEditOpen(false);
      setEditingId(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const createResident = useMutation({
    mutationFn: async () => {
      if (!addForm.name.trim()) throw new Error("Name is required");
      const { error } = await supabase.from("residents").insert({
        name: addForm.name.trim(),
        status: addForm.status,
        lease_start: addForm.lease_start || null,
        lease_end: addForm.lease_end || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      toast.success("Resident added");
      setAddOpen(false);
      setAddForm({ name: "", status: "Active", lease_start: "", lease_end: "" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteResident = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("residents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["residents"] });
      toast.success("Resident removed");
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openDocs = (resident: { id: string; name: string }) => {
    setSelectedResident(resident);
    setDocsOpen(true);
  };

  const openEdit = (resident: any) => {
    setEditingId(resident.id);
    setEditForm({
      name: resident.name,
      status: resident.status ?? "Active",
      lease_start: resident.lease_start ?? "",
      lease_end: resident.lease_end ?? "",
    });
    setEditOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedResident) return;
    const files = Array.from(e.target.files);
    e.target.value = "";
    setUploading(true);

    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user?.id;

    for (const file of files) {
      const path = `${selectedResident.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file);

      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { error: dbError } = await supabase.from("resident_documents").insert({
        resident_id: selectedResident.id,
        name: file.name,
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: userId ?? null,
      });

      if (dbError) {
        toast.error(`Failed to save record for ${file.name}`);
      }
    }

    setUploading(false);
    refetchDocs();
    toast.success("Upload complete");
  };

  const getPublicUrl = (path: string) =>
    supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Residents</h1>
          <p className="text-muted-foreground">Manage resident profiles and leases</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Resident
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Residents</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading residents…</p>
          ) : !residents || residents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium">No residents yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first resident to start managing profiles.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Room/Bed</TableHead>
                  <TableHead>Lease Start</TableHead>
                  <TableHead>Lease End</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {residents.map((resident) => (
                  <TableRow key={resident.id}>
                    <TableCell className="font-medium">{resident.name}</TableCell>
                    <TableCell>{getRoomBed(resident)}</TableCell>
                    <TableCell>{resident.lease_start ?? "—"}</TableCell>
                    <TableCell>{resident.lease_end ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={
                          resident.balance && resident.balance > 0
                            ? "text-destructive font-semibold"
                            : ""
                        }
                      >
                        {resident.balance ? `$${resident.balance.toLocaleString()}` : "$0"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          resident.status === "Active" ? "default" : "destructive"
                        }
                      >
                        {resident.status ?? "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(resident)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              openDocs({ id: resident.id, name: resident.name })
                            }
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Documents
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setDeleteTarget({ id: resident.id, name: resident.name })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Resident
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Resident Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Resident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={addForm.status}
                onValueChange={(v) => setAddForm({ ...addForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lease Start</Label>
              <Input
                type="date"
                value={addForm.lease_start}
                onChange={(e) => setAddForm({ ...addForm, lease_start: e.target.value })}
              />
            </div>
            <div>
              <Label>Lease End</Label>
              <Input
                type="date"
                value={addForm.lease_end}
                onChange={(e) => setAddForm({ ...addForm, lease_end: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button onClick={() => createResident.mutate()} disabled={createResident.isPending}>
                {createResident.isPending ? "Adding…" : "Add Resident"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Resident Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Resident</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(v) => setEditForm({ ...editForm, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Discharged">Discharged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lease Start</Label>
              <Input
                type="date"
                value={editForm.lease_start}
                onChange={(e) => setEditForm({ ...editForm, lease_start: e.target.value })}
              />
            </div>
            <div>
              <Label>Lease End</Label>
              <Input
                type="date"
                value={editForm.lease_end}
                onChange={(e) => setEditForm({ ...editForm, lease_end: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button onClick={() => updateResident.mutate()} disabled={updateResident.isPending}>
                {updateResident.isPending ? "Saving…" : "Save Changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this resident record. Documents and associated data will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteResident.mutate(deleteTarget.id)}
            >
              {deleteResident.isPending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Documents Dialog */}
      <Dialog open={docsOpen} onOpenChange={setDocsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Documents — {selectedResident?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? "Uploading…" : "Upload Document"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {!documents || documents.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 py-3">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(doc.file_size)}
                        {doc.file_size ? " · " : ""}
                        {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={getPublicUrl(doc.file_path)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() =>
                          deleteDocMutation.mutate({
                            docId: doc.id,
                            filePath: doc.file_path,
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
