import { ReactNode, useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { NotificationCenter } from "@/components/NotificationCenter";

interface MainLayoutProps {
  children: ReactNode;
}

type SearchResult = {
  id: string;
  type: "resident" | "house" | "contact";
  label: string;
  sublabel?: string;
  href: string;
};

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    const term = `%${debouncedQuery.trim()}%`;
    setLoading(true);

    Promise.all([
      supabase
        .from("residents")
        .select("id, name, room, status")
        .ilike("name", term)
        .limit(5),
      supabase
        .from("houses")
        .select("id, name, address")
        .or(`name.ilike.${term},address.ilike.${term}`)
        .limit(5),
      supabase
        .from("crm_contacts")
        .select("id, first_name, last_name, role")
        .or(`first_name.ilike.${term},last_name.ilike.${term}`)
        .limit(5),
    ])
      .then(([residents, houses, contacts]) => {
        const items: SearchResult[] = [];

        for (const r of residents.data ?? []) {
          items.push({
            id: `resident-${r.id}`,
            type: "resident",
            label: r.name,
            sublabel: r.room ? `Room ${r.room}` : (r.status ?? "Resident"),
            href: "/residents",
          });
        }
        for (const h of houses.data ?? []) {
          items.push({
            id: `house-${h.id}`,
            type: "house",
            label: h.name,
            sublabel: h.address,
            href: `/houses/${h.id}`,
          });
        }
        for (const c of contacts.data ?? []) {
          items.push({
            id: `contact-${c.id}`,
            type: "contact",
            label: `${c.first_name} ${c.last_name}`,
            sublabel: c.role ?? "Contact",
            href: `/crm/contacts/${c.id}`,
          });
        }

        setResults(items);
        setOpen(items.length > 0);
      })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (result: SearchResult) => {
    setQuery("");
    setOpen(false);
    navigate(result.href);
  };

  const typeLabel: Record<SearchResult["type"], string> = {
    resident: "Resident",
    house: "House",
    contact: "Contact",
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-card px-6">
            <SidebarTrigger />
            <div className="flex-1 max-w-md" ref={containerRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search residents, houses, contacts…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => {
                    if (results.length > 0) setOpen(true);
                  }}
                />
                {open && results.length > 0 && (
                  <div className="absolute top-full mt-1 w-full rounded-md border bg-popover shadow-md z-50">
                    {results.map((result) => (
                      <button
                        key={result.id}
                        className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleSelect(result);
                        }}
                      >
                        <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
                          {typeLabel[result.type]}
                        </span>
                        <span className="flex flex-col">
                          <span className="text-sm font-medium">{result.label}</span>
                          {result.sublabel && (
                            <span className="text-xs text-muted-foreground">{result.sublabel}</span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {open && results.length === 0 && !loading && query.trim() && (
                  <div className="absolute top-full mt-1 w-full rounded-md border bg-popover shadow-md z-50 px-3 py-4 text-sm text-muted-foreground text-center">
                    No results for "{query}"
                  </div>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <NotificationCenter />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
