import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase before importing the module
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });
const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: "user-123" } },
});

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (...args: any[]) => mockFrom(...args),
    auth: {
      getUser: () => mockGetUser(),
    },
  },
}));

// Import after mock
const { logAudit } = await import("./audit");

describe("logAudit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
    });
  });

  it("inserts an audit log entry with user ID", async () => {
    await logAudit("INSERT", "house", "house-1");

    expect(mockFrom).toHaveBeenCalledWith("audit_log");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      action: "INSERT",
      entity_type: "house",
      entity_id: "house-1",
      old_value: null,
      new_value: null,
    });
  });

  it("includes change data when provided", async () => {
    await logAudit("UPDATE", "resident", "res-1", {
      old: { status: "Active" },
      new: { status: "Inactive" },
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-123",
      action: "UPDATE",
      entity_type: "resident",
      entity_id: "res-1",
      old_value: { status: "Active" },
      new_value: { status: "Inactive" },
    });
  });

  it("handles missing user gracefully", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    await logAudit("LOGIN", "session");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: null })
    );
  });

  it("handles missing entity_id", async () => {
    await logAudit("LOGOUT", "session");

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ entity_id: null })
    );
  });
});
