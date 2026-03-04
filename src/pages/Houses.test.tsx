import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";

const mockHouses = [
  { id: "h1", name: "Sunrise House", address: "123 Main St", created_at: "2024-01-01" },
  { id: "h2", name: "Moonlight Manor", address: "456 Oak Ave", created_at: "2024-01-02" },
];

// Track mutation calls
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
const mockDelete = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn((table: string) => {
      if (table === "houses") {
        return {
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockHouses, error: null }),
          }),
          insert: mockInsert,
          update: (...args: any[]) => mockUpdate(...args),
          delete: (...args: any[]) => mockDelete(...args),
        };
      }
      if (table === "beds") {
        return {
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
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

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import Houses from "./Houses";

describe("Houses page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title and Add House button", async () => {
    renderWithProviders(<Houses />);
    expect(screen.getByText("Houses")).toBeInTheDocument();
    expect(screen.getByText("Add House")).toBeInTheDocument();
  });

  it("displays house cards after loading", async () => {
    renderWithProviders(<Houses />);

    await waitFor(() => {
      expect(screen.getByText("Sunrise House")).toBeInTheDocument();
      expect(screen.getByText("Moonlight Manor")).toBeInTheDocument();
    });
  });

  it("shows addresses on cards", async () => {
    renderWithProviders(<Houses />);

    await waitFor(() => {
      expect(screen.getByText("123 Main St")).toBeInTheDocument();
      expect(screen.getByText("456 Oak Ave")).toBeInTheDocument();
    });
  });

  it("opens Add House dialog when button clicked", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Houses />);

    await user.click(screen.getAllByText("Add House")[0]);

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
      expect(screen.getByLabelText("Address")).toBeInTheDocument();
    });
  });

  it("shows Open House button on each card", async () => {
    renderWithProviders(<Houses />);

    await waitFor(() => {
      const openButtons = screen.getAllByText("Open House");
      expect(openButtons).toHaveLength(2);
    });
  });
});
