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
} from "@/components/ui/dialog";
import { Plus, MoreHorizontal, FileText, Upload, Trash2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const BUCKET = "resident-documents";

export default function Residents() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docsOpen, setDocsOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<{ id: string; name: string } | null>(
    null
  );
  const [uploading, setUploading] = useState(false);

  // Fetch residents from DB
  const { data: residents, isLoading } = useQuery({
    queryKey: ["residents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("residents")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch documents for selected resident
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

  const openDocs = (resident: { id: string; name: string }) => {
    setSelectedResident(resident);
    setDocsOpen(true);
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
        <Button>
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
                {residents && residents.length > 0 ? (
                  residents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium">{resident.name}</TableCell>
                      <TableCell>{resident.room ?? "—"}</TableCell>
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
                            <DropdownMenuItem>View Profile</DropdownMenuItem>
                            <DropdownMenuItem>Edit Details</DropdownMenuItem>
                            <DropdownMenuItem>Send Message</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                openDocs({ id: resident.id, name: resident.name })
                              }
                            >
                              <FileText className="mr-2 h-4 w-4" />
                              Documents
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No residents found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
