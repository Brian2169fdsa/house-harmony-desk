import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";

const threads = [
  {
    id: 1,
    subject: "House Meeting Reminder",
    lastMessage: "Don't forget about the house meeting this Thursday at 7 PM.",
    timestamp: "2 hours ago",
    unread: 0,
  },
  {
    id: 2,
    subject: "Maintenance Update",
    lastMessage: "The HVAC repair has been scheduled for next Monday.",
    timestamp: "1 day ago",
    unread: 2,
  },
  {
    id: 3,
    subject: "Community Event",
    lastMessage: "We're organizing a BBQ this weekend. Everyone's invited!",
    timestamp: "3 days ago",
    unread: 0,
  },
];

export default function Messages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with residents and staff
          </p>
        </div>
        <Button>New Message</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Threads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {threads.map((thread) => (
              <div
                key={thread.id}
                className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <p className="font-medium text-sm">{thread.subject}</p>
                  {thread.unread > 0 && (
                    <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                      {thread.unread}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {thread.lastMessage}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {thread.timestamp}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>House Meeting Reminder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4 min-h-[300px]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-medium">ST</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Staff</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Don't forget about the house meeting this Thursday at 7 PM.
                    We'll be discussing house rules and upcoming events.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    2 hours ago
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <Textarea placeholder="Type your message..." className="mb-2" />
              <div className="flex justify-end">
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
