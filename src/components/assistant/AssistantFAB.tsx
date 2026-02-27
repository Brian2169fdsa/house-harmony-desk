import { Sparkles } from "lucide-react";
import { useAssistant } from "@/contexts/AssistantContext";

export function AssistantFAB() {
  const { isOpen, toggleAssistant } = useAssistant();

  if (isOpen) return null;

  return (
    <button
      onClick={toggleAssistant}
      className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
      aria-label="Open AI Assistant"
    >
      <Sparkles className="h-6 w-6 group-hover:rotate-12 transition-transform" />
    </button>
  );
}
