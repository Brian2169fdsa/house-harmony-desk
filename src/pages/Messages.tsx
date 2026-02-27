import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Send, Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Messages() {
  const queryClient = useQueryClient();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [messageBody, setMessageBody] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [newThread, setNewThread] = useState({ subject: "", house_id: "" });

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id ?? null);
    });
  }, []);

  const { data: threads = [] } = useQuery({
    queryKey: ["message_threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_threads")
        .select("*")
        .order("created_at", { ascending: false });
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

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedThreadId],
    enabled: !!selectedThreadId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", selectedThreadId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!selectedThreadId || !messageBody.trim()) {
        throw new Error("Thread and message body required");
      }
      const { error } = await supabase.from("messages").insert([
        {
          thread_id: selectedThreadId,
          sender_id: userId,
          body: messageBody.trim(),
          read: false,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["messages", selectedThreadId],
      });
      setMessageBody("");
    },
    onError: () => {
      toast({ title: "Failed to send message", variant: "destructive" });
    },
  });

  const createThread = useMutation({
    mutationFn: async () => {
      if (!newThread.subject.trim()) throw new Error("Subject required");
      const { data, error } = await supabase
        .from("message_threads")
        .insert([
          {
            subject: newThread.subject,
            house_id: newThread.house_id || null,
            created_by: userId,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (thread) => {
      queryClient.invalidateQueries({ queryKey: ["message_threads"] });
      setSelectedThreadId(thread.id);
      setNewThread({ subject: "", house_id: "" });
      setNewThreadOpen(false);
      toast({ title: "Thread created" });
    },
    onError: () => {
      toast({ title: "Failed to create thread", variant: "destructive" });
    },
  });

  const selectedThread = (threads as any[]).find(
    (t) => t.id === selectedThreadId
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with residents and staff
          </p>
        </div>
        <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New Thread</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject *</Label>
                <Input
                  value={newThread.subject}
                  onChange={(e) =>
                    setNewThread({ ...newThread, subject: e.target.value })
                  }
                  placeholder="Thread subject"
                />
              </div>
              <div>
                <Label>House</Label>
                <Select
                  value={newThread.house_id}
                  onValueChange={(v) =>
                    setNewThread({ ...newThread, house_id: v })
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
              <Button
                onClick={() => createThread.mutate()}
                className="w-full"
                disabled={createThread.isPending}
              >
                Create Thread
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {threads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No threads yet</p>
            ) : (
              (threads as any[]).map((thread) => (
                <div
                  key={thread.id}
                  onClick={() => setSelectedThreadId(thread.id)}
                  className={`p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${
                    selectedThreadId === thread.id ? "bg-muted" : ""
                  }`}
                >
                  <p className="font-medium text-sm">{thread.subject}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(thread.created_at), "MMM d, h:mm a")}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          {selectedThread ? (
            <>
              <CardHeader>
                <CardTitle>{selectedThread.subject}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No messages yet. Start the conversation.
                    </p>
                  ) : (
                    (messages as any[]).map((msg) => (
                      <div key={msg.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-medium">
                            {msg.sender_id === userId ? "Me" : "??"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {msg.sender_id === userId ? "You" : "Staff"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {msg.body}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(msg.created_at), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t pt-4">
                  <Textarea
                    placeholder="Type your message..."
                    className="mb-2"
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        if (messageBody.trim()) sendMessage.mutate();
                      }
                    }}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => sendMessage.mutate()}
                      disabled={!messageBody.trim() || sendMessage.isPending}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Send
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground">
                Select a thread to view messages
              </p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
