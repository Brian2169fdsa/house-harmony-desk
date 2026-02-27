import { useState, useRef, useEffect } from "react";
import { useAssistant, AssistantMessage } from "@/contexts/AssistantContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  X,
  Send,
  Sparkles,
  Plus,
  History,
  ChevronLeft,
  MessageSquare,
  Bot,
} from "lucide-react";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

// ─── Quick action chips ──────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  "Show overdue payments",
  "Occupancy summary",
  "Open maintenance tickets",
  "Upcoming move-outs",
  "Drug test compliance",
];

// ─── Simple markdown renderer ────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="font-semibold text-sm">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.startsWith("- **")) {
      const match = line.match(/^- \*\*(.+?)\*\*(.*)$/);
      if (match) {
        elements.push(
          <p key={i} className="text-sm ml-2">
            <span className="font-semibold">{match[1]}</span>
            {match[2]}
          </p>
        );
      } else {
        elements.push(<p key={i} className="text-sm ml-2">{line.replace(/\*\*/g, "")}</p>);
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <p key={i} className="text-sm ml-2">
          {"\u2022 "}{line.slice(2).replace(/\*\*/g, "")}
        </p>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={i} className="h-2" />);
    } else {
      elements.push(
        <p key={i} className="text-sm">
          {line.replace(/\*\*(.+?)\*\*/g, (_, m) => m)}
        </p>
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}

// ─── Typing indicator ────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2 px-4 py-2">
      <div className="shrink-0 mt-0.5 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-2.5">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4 py-1`}>
      {!isUser && (
        <div className="shrink-0 mt-0.5 mr-2 h-7 w-7 rounded-full bg-muted flex items-center justify-center">
          <Bot className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        }`}
      >
        {isUser ? (
          <p className="text-sm">{message.content}</p>
        ) : (
          renderMarkdown(message.content)
        )}
        <p
          className={`text-[10px] mt-1 ${
            isUser ? "text-primary-foreground/60" : "text-muted-foreground/60"
          }`}
        >
          {format(new Date(message.timestamp), "h:mm a")}
        </p>
      </div>
    </div>
  );
}

// ─── Conversation history sidebar ────────────────────────────────────────────

function ConversationHistory() {
  const { conversations, loadConversation, startNewConversation, toggleHistory } = useAssistant();

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleHistory}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">Conversations</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 ml-auto"
          onClick={() => startNewConversation()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1">
        {conversations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            No conversations yet.
          </p>
        ) : (
          <div className="py-1">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors"
                onClick={() => loadConversation(conv.id)}
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium truncate">{conv.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground ml-5.5 mt-0.5">
                  {conv.messages.length} message{conv.messages.length !== 1 ? "s" : ""} ·{" "}
                  {format(new Date(conv.updatedAt), "MMM d")}
                </p>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function AssistantPanel() {
  const {
    isOpen,
    isHistoryOpen,
    activeConversation,
    isTyping,
    closeAssistant,
    toggleHistory,
    sendMessage,
    startNewConversation,
  } = useAssistant();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeConversation?.messages, isTyping]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  const messages = activeConversation?.messages ?? [];

  const panelClasses = isMobile
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "fixed right-0 top-0 bottom-0 z-50 w-[400px] bg-background border-l shadow-xl flex flex-col";

  return (
    <div className={panelClasses}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold leading-none">AI Assistant</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Sober living operations</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startNewConversation()}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={toggleHistory}>
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={closeAssistant}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Body — history sidebar or chat */}
      {isHistoryOpen ? (
        <ConversationHistory />
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto py-3">
            {messages.length === 0 && !isTyping ? (
              <div className="flex flex-col items-center justify-center h-full px-6 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-base mb-1">SoberOps Assistant</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Ask me about residents, payments, occupancy, maintenance, or compliance.
                </p>
                {activeConversation?.context && (
                  <div className="mb-4 px-3 py-2 rounded-lg bg-muted text-xs text-muted-foreground">
                    Context: {activeConversation.context.entityType} — {activeConversation.context.entityName}
                  </div>
                )}
              </div>
            ) : (
              messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
            )}
            {isTyping && <TypingIndicator />}
          </div>

          {/* Quick actions */}
          {messages.length === 0 && !isTyping && (
            <>
              <Separator />
              <div className="px-3 py-2.5 flex gap-2 flex-wrap">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action}
                    className="text-xs px-3 py-1.5 rounded-full border bg-card hover:bg-accent transition-colors"
                    onClick={() => sendMessage(action)}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Input */}
          <div className="border-t px-3 py-3">
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                className="flex-1"
                disabled={isTyping}
              />
              <Button
                size="sm"
                className="h-9 w-9 p-0 shrink-0"
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
