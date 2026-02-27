import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
const uuidv4 = () => crypto.randomUUID();

// ─── Types ──────────────────────────────────────────────────────────────────

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export type ConversationContext = {
  entityType?: string;
  entityId?: string;
  entityName?: string;
  extra?: Record<string, unknown>;
};

export type Conversation = {
  id: string;
  title: string;
  messages: AssistantMessage[];
  context: ConversationContext | null;
  createdAt: string;
  updatedAt: string;
};

type AssistantContextValue = {
  isOpen: boolean;
  isPanelOpen: boolean;
  isHistoryOpen: boolean;
  activeConversation: Conversation | null;
  conversations: Conversation[];
  isTyping: boolean;
  openAssistant: (ctx?: ConversationContext) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  toggleHistory: () => void;
  sendMessage: (content: string) => Promise<void>;
  startNewConversation: (ctx?: ConversationContext) => void;
  loadConversation: (id: string) => void;
  loadConversations: () => Promise<void>;
};

const AssistantContext = createContext<AssistantContextValue | null>(null);

// ─── Simulated response generator ────────────────────────────────────────────

function generateSimulatedResponse(
  message: string,
  queryClient: ReturnType<typeof useQueryClient>,
  context?: ConversationContext | null
): string {
  const lower = message.toLowerCase();

  // Occupancy queries
  if (lower.includes("occupancy") || lower.includes("vacancy") || lower.includes("vacant")) {
    const houses = queryClient.getQueryData<any[]>(["houses"]) ?? [];
    const beds = queryClient.getQueryData<any[]>(["beds"]) ?? [];
    if (beds.length > 0) {
      const occupied = beds.filter((b: any) => b.status === "occupied").length;
      const rate = beds.length > 0 ? Math.round((occupied / beds.length) * 100) : 0;
      return `**Occupancy Summary**\n\n- **Total Beds:** ${beds.length}\n- **Occupied:** ${occupied}\n- **Vacant:** ${beds.length - occupied}\n- **Occupancy Rate:** ${rate}%\n\n${houses.length > 0 ? `Across **${houses.length} house${houses.length !== 1 ? "s" : ""}**.` : ""}\n\nWould you like me to break this down by house?`;
    }
    return "I can see you're asking about occupancy. Enable the houses and beds data to get real-time occupancy statistics. You can view this at the **Houses** page.";
  }

  // Payment queries
  if (lower.includes("payment") || lower.includes("overdue") || lower.includes("balance") || lower.includes("invoice")) {
    const invoices = queryClient.getQueryData<any[]>(["invoices"]) ?? [];
    if (invoices.length > 0) {
      const overdue = invoices.filter((i: any) => i.status === "overdue");
      const pending = invoices.filter((i: any) => i.status === "pending");
      const totalOverdue = overdue.reduce((s: number, i: any) => s + (i.amount_cents || 0), 0);
      return `**Payment Overview**\n\n- **Total Invoices:** ${invoices.length}\n- **Overdue:** ${overdue.length} ($${(totalOverdue / 100).toFixed(2)})\n- **Pending:** ${pending.length}\n\n${overdue.length > 0 ? "Would you like me to list the overdue residents?" : "All payments are on track!"}`;
    }
    return "I can help with payment information. Check the **Payments** page for detailed invoice tracking and AR management.";
  }

  // Resident queries
  if (lower.includes("resident") || lower.includes("who lives") || lower.includes("how many people")) {
    const residents = queryClient.getQueryData<any[]>(["residents"]) ?? [];
    if (residents.length > 0) {
      const active = residents.filter((r: any) => r.status === "active" || r.status === "Active");
      return `**Resident Summary**\n\n- **Total Residents:** ${residents.length}\n- **Active:** ${active.length}\n- **Inactive/Departed:** ${residents.length - active.length}\n\nWould you like details on a specific resident?`;
    }
    return "I can help with resident information. Navigate to the **Residents** page to view and manage all residents.";
  }

  // Maintenance queries
  if (lower.includes("maintenance") || lower.includes("repair") || lower.includes("fix") || lower.includes("ticket")) {
    const requests = queryClient.getQueryData<any[]>(["maintenance-requests"]) ?? [];
    if (requests.length > 0) {
      const open = requests.filter((r: any) => r.status !== "complete" && r.status !== "cancelled");
      return `**Maintenance Overview**\n\n- **Total Requests:** ${requests.length}\n- **Open Tickets:** ${open.length}\n- **Completed:** ${requests.length - open.length}\n\nWould you like me to show details on open tickets?`;
    }
    return "I can help with maintenance requests. Check the **Maintenance** page to view and create work orders.";
  }

  // Drug test / compliance queries
  if (lower.includes("drug test") || lower.includes("compliance") || lower.includes("test")) {
    return "**Compliance Snapshot**\n\nI can help track:\n- Drug test compliance rates\n- Meeting attendance compliance\n- Staff certification status\n- Facility supply expirations\n\nVisit the **Compliance Dashboard** for detailed breakdowns, or ask me about a specific area.";
  }

  // Move-out queries
  if (lower.includes("move-out") || lower.includes("moveout") || lower.includes("upcoming") || lower.includes("leaving")) {
    const residents = queryClient.getQueryData<any[]>(["residents"]) ?? [];
    const withMoveOut = residents.filter((r: any) => r.move_out_date);
    if (withMoveOut.length > 0) {
      return `**Upcoming Move-Outs**\n\nThere are **${withMoveOut.length}** residents with scheduled move-out dates. Check the **Residents** page for specific dates and plan bed turnover accordingly.`;
    }
    return "No upcoming move-outs currently scheduled. You can set move-out dates from the **Residents** page.";
  }

  // Context-aware responses
  if (context?.entityType === "resident" && context.entityName) {
    return `I have **${context.entityName}**'s profile loaded. What would you like to know?\n\n- Payment history\n- Drug test records\n- Program progress\n- Lease details\n- Incident reports`;
  }

  // Greeting
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey")) {
    return "Hello! I'm your SoberOps AI Assistant. I can help you with:\n\n- **Occupancy** — bed availability and vacancy rates\n- **Payments** — overdue invoices and collection status\n- **Residents** — profiles, compliance, and program progress\n- **Maintenance** — open tickets and vendor dispatch\n- **Compliance** — drug tests, meetings, certifications\n\nWhat would you like to know?";
  }

  // Default
  return "I understand you're asking about **" + message.slice(0, 50) + (message.length > 50 ? "..." : "") + "**.\n\nI'm currently operating in demo mode with access to your cached data. Once the Claude API integration is connected via Supabase Edge Functions, I'll be able to provide more detailed analysis and take actions on your behalf.\n\nTry asking about:\n- Occupancy summary\n- Overdue payments\n- Open maintenance tickets\n- Drug test compliance";
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AssistantProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const loadConversations = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("agent_conversations")
      .select("*")
      .eq("user_id", user.id)
      .eq("agent_type", "assistant")
      .eq("is_archived", false)
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) {
      setConversations(
        data.map((c: any) => ({
          id: c.id,
          title: c.title || "Untitled",
          messages: (c.messages_json as AssistantMessage[]) ?? [],
          context: c.context_json as ConversationContext | null,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
      );
    }
  }, []);

  const startNewConversation = useCallback((ctx?: ConversationContext) => {
    const conv: Conversation = {
      id: uuidv4(),
      title: ctx?.entityName ? `Chat about ${ctx.entityName}` : "New conversation",
      messages: [],
      context: ctx ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setActiveConversation(conv);
    setIsHistoryOpen(false);
  }, []);

  const openAssistant = useCallback(
    (ctx?: ConversationContext) => {
      setIsOpen(true);
      if (ctx || !activeConversation) {
        startNewConversation(ctx);
      }
    },
    [activeConversation, startNewConversation]
  );

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
    setIsHistoryOpen(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    if (isOpen) {
      closeAssistant();
    } else {
      openAssistant();
    }
  }, [isOpen, closeAssistant, openAssistant]);

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
    if (!isHistoryOpen) loadConversations();
  }, [isHistoryOpen, loadConversations]);

  const loadConversation = useCallback((id: string) => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setActiveConversation(conv);
      setIsHistoryOpen(false);
    }
  }, [conversations]);

  const saveConversation = useCallback(
    async (conv: Conversation) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("agent_conversations").upsert({
        id: conv.id,
        user_id: user.id,
        agent_type: "assistant",
        title: conv.title,
        messages_json: conv.messages as any,
        context_json: conv.context as any,
        is_archived: false,
        updated_at: new Date().toISOString(),
      });
    },
    []
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      let conv = activeConversation;
      if (!conv) {
        conv = {
          id: uuidv4(),
          title: content.slice(0, 60),
          messages: [],
          context: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Add user message
      const userMsg: AssistantMessage = {
        id: uuidv4(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };
      const updatedMessages = [...conv.messages, userMsg];
      const updatedConv = {
        ...conv,
        messages: updatedMessages,
        title: conv.messages.length === 0 ? content.slice(0, 60) : conv.title,
        updatedAt: new Date().toISOString(),
      };
      setActiveConversation(updatedConv);

      // Log action
      await supabase.from("agent_actions_log").insert({
        agent_type: "assistant",
        action_type: "chat_message",
        entity_type: conv.context?.entityType ?? null,
        entity_id: conv.context?.entityId ?? null,
        input_json: { message: content },
        status: "running",
      });

      // Simulate typing delay
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

      // Generate response
      const response = generateSimulatedResponse(content, queryClient, conv.context);
      const assistantMsg: AssistantMessage = {
        id: uuidv4(),
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      const finalMessages = [...updatedMessages, assistantMsg];
      const finalConv = {
        ...updatedConv,
        messages: finalMessages,
        updatedAt: new Date().toISOString(),
      };

      setActiveConversation(finalConv);
      setIsTyping(false);

      // Persist to DB
      await saveConversation(finalConv);
    },
    [activeConversation, queryClient, saveConversation]
  );

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        isPanelOpen: isOpen,
        isHistoryOpen,
        activeConversation,
        conversations,
        isTyping,
        openAssistant,
        closeAssistant,
        toggleAssistant,
        toggleHistory,
        sendMessage,
        startNewConversation,
        loadConversation,
        loadConversations,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error("useAssistant must be used inside AssistantProvider");
  return ctx;
}
