import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LoginForm } from "@/components/login-form";

// Mock the server actions — they cannot run in a jsdom environment
vi.mock("@/actions/auth", () => ({
  getUserContext: vi.fn(),
  sendMagicLink: vi.fn(),
}));

describe("LoginForm", () => {
  it("renders the email input and continue button", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it("shows the invite-only message", () => {
    render(<LoginForm />);
    expect(screen.getByText(/invite-only/i)).toBeInTheDocument();
  });
});
