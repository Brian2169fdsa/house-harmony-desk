import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";

const mockInvoices = [
  {
    id: "inv-1",
    resident_id: "r1",
    house_id: null,
    amount_cents: 80000,
    due_date: "2024-03-01",
    paid_date: null,
    status: "pending",
    description: "March rent",
    created_at: "2024-02-15",
    updated_at: "2024-02-15",
    residents: { name: "Jane Smith" },
  },
  {
    id: "inv-2",
    resident_id: "r2",
    house_id: null,
    amount_cents: 75000,
    due_date: "2024-02-01",
    paid_date: "2024-02-05",
    status: "paid",
    description: "February rent",
    created_at: "2024-01-15",
    updated_at: "2024-02-05",
    residents: { name: "Bob Jones" },
  },
];

const mockResidents = [
  { id: "r1", name: "Jane Smith" },
  { id: "r2", name: "Bob Jones" },
];

function createChainableResult(result: any) {
  const chain: any = {};
  const methods = ["select", "order", "range", "eq", "neq", "limit", "insert", "update", "delete"];
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make it thenable
  chain.then = (resolve: any) => Promise.resolve(result).then(resolve);
  return chain;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "invoices") {
        return {
          select: vi.fn((sel: string, opts?: any) => {
            // Count query
            if (opts?.count === "exact" && opts?.head) {
              return Promise.resolve({ count: mockInvoices.length, error: null });
            }
            // Data query — returns chainable mock
            return createChainableResult({ data: mockInvoices, error: null });
          }),
          insert: vi.fn().mockResolvedValue({ error: null }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      if (table === "residents") {
        return {
          select: vi.fn().mockReturnValue(
            createChainableResult({ data: mockResidents, error: null })
          ),
        };
      }
      if (table === "payments") {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnValue(
          createChainableResult({ data: [], error: null })
        ),
      };
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

import Payments from "./Payments";

describe("Payments page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and Create Invoice button", () => {
    renderWithProviders(<Payments />);
    expect(screen.getByText("Payments")).toBeInTheDocument();
    expect(screen.getByText("Create Invoice")).toBeInTheDocument();
  });

  it("shows KPI cards", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText("Total Outstanding")).toBeInTheDocument();
      expect(screen.getByText("Collected This Month")).toBeInTheDocument();
      expect(screen.getByText("Payment Success Rate")).toBeInTheDocument();
    });
  });

  it("displays invoice table with resident names", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("Bob Jones")).toBeInTheDocument();
    });
  });

  it("formats cents correctly in invoice amounts", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      const amounts800 = screen.getAllByText("$800.00");
      expect(amounts800.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText("$750.00")).toBeInTheDocument();
    });
  });

  it("shows Mark Paid button only for unpaid invoices", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      const markPaidButtons = screen.getAllByText("Mark Paid");
      expect(markPaidButtons).toHaveLength(1);
    });
  });

  it("shows correct status badges", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText("Pending")).toBeInTheDocument();
      expect(screen.getByText("Paid")).toBeInTheDocument();
    });
  });

  it("opens create invoice dialog", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Payments />);

    await user.click(screen.getByText("Create Invoice"));

    await waitFor(() => {
      expect(screen.getAllByText("Create Invoice").length).toBeGreaterThanOrEqual(2);
      expect(screen.getAllByText("Resident").length).toBeGreaterThanOrEqual(2);
    });
  });

  it("calculates payment success rate", async () => {
    renderWithProviders(<Payments />);

    await waitFor(() => {
      expect(screen.getByText("50%")).toBeInTheDocument();
    });
  });
});
