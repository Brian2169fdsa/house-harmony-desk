import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/test-utils";

// Mock supabase
const mockSignIn = vi.fn().mockResolvedValue({ data: {}, error: null });
const mockSignUp = vi.fn().mockResolvedValue({ data: {}, error: null });

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args: any[]) => mockSignIn(...args),
      signUp: (...args: any[]) => mockSignUp(...args),
      getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

import Auth from "./Auth";
import { toast } from "sonner";

describe("Auth page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login and signup tabs", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
    expect(screen.getByText("House Harmony")).toBeInTheDocument();
  });

  it("shows login form by default with email and password inputs", () => {
    renderWithProviders(<Auth />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign In")).toBeInTheDocument();
  });

  it("calls signInWithPassword on login submit", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows validation error for short password", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "abc");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Password must be at least 6 characters"
      );
    });
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("does not call signIn with invalid email (zod rejects it)", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    // Type an invalid email — native type="email" validation may block submit,
    // but Zod validation is the safety net
    const emailInput = screen.getByLabelText("Email");
    await user.type(emailInput, "not-an-email");
    await user.type(screen.getByLabelText("Password"), "password123");

    // The form may not submit due to native HTML validation on type="email"
    // In either case, signIn should not be called
    await user.click(screen.getByText("Sign In"));

    // Give it time to possibly process
    await new Promise((r) => setTimeout(r, 100));
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("navigates to / on successful login", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  it("shows error on login failure", async () => {
    mockSignIn.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass1");
    await user.click(screen.getByText("Sign In"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Invalid email or password");
    });
  });

  it("switches to signup tab and shows additional fields", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.click(screen.getByText("Sign Up"));

    expect(screen.getByLabelText("First Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("calls signUp with correct data", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Auth />);

    await user.click(screen.getByText("Sign Up"));
    await user.type(screen.getByLabelText("First Name"), "John");
    await user.type(screen.getByLabelText("Last Name"), "Doe");
    // Need to get the signup email/password fields (there are two sets)
    const emailInputs = screen.getAllByPlaceholderText("you@example.com");
    const passwordInputs = screen.getAllByPlaceholderText(/characters/i);
    await user.type(emailInputs[emailInputs.length - 1], "john@example.com");
    await user.type(passwordInputs[0], "password123");
    await user.click(screen.getByText("Create Account"));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john@example.com",
          password: "password123",
        })
      );
    });
  });
});
