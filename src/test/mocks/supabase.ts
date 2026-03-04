import { vi } from "vitest";

// Chainable mock builder for supabase query methods
function createChainableMock(resolveWith: { data: unknown; error: null } | { data: null; error: { message: string } }) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(resolveWith),
    then: vi.fn((cb: any) => cb(resolveWith)),
  };
  // Make the chain itself thenable (for `await supabase.from(...).select(...)`)
  chain[Symbol.for("thenable")] = true;
  // Override .then so it acts as a promise
  const originalOrder = chain.order;
  chain.order = vi.fn((...args: any[]) => {
    const result = { ...chain };
    result.then = (resolve: any) => resolve(resolveWith);
    // Make it a proper thenable
    Object.defineProperty(result, "then", {
      value: (resolve: any) => Promise.resolve(resolveWith).then(resolve),
    });
    return result;
  });
  // Also make the base chain thenable
  Object.defineProperty(chain, "then", {
    value: (resolve: any) => Promise.resolve(resolveWith).then(resolve),
    configurable: true,
  });
  return chain;
}

export function createMockSupabase(overrides?: {
  fromData?: Record<string, unknown[]>;
  authUser?: { id: string; email: string } | null;
}) {
  const fromData = overrides?.fromData ?? {};
  const authUser = overrides?.authUser ?? null;

  return {
    from: vi.fn((table: string) => {
      const data = fromData[table] ?? [];
      return createChainableMock({ data, error: null });
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: authUser },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: authUser ? { user: authUser } : null },
        error: null,
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        remove: vi.fn().mockResolvedValue({ data: {}, error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://test.supabase.co/storage/v1/test" },
        }),
      }),
    },
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
    functions: {
      invoke: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  };
}
