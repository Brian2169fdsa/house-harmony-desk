import { createContext, useContext, ReactNode } from "react";

interface AssistantContextType {
  isOpen: boolean;
  toggle: () => void;
}

const AssistantContext = createContext<AssistantContextType>({
  isOpen: false,
  toggle: () => {},
});

export function AssistantProvider({ children }: { children: ReactNode }) {
  return (
    <AssistantContext.Provider value={{ isOpen: false, toggle: () => {} }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  return useContext(AssistantContext);
}
