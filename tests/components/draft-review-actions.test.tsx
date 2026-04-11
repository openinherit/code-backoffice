import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { DraftReviewActions } from "@/components/draft-review-actions";

vi.mock("@/actions/drafts", () => ({
  approveDraft: vi.fn().mockResolvedValue(undefined),
  rejectDraft: vi.fn().mockResolvedValue(undefined),
}));

describe("DraftReviewActions", () => {
  it("renders approve and reject buttons", () => {
    render(<DraftReviewActions draftId="draft-1" />);
    expect(
      screen.getByRole("button", { name: /approve/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reject/i }),
    ).toBeInTheDocument();
  });

  it("shows reject note input when reject is clicked", async () => {
    const user = userEvent.setup();
    render(<DraftReviewActions draftId="draft-1" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));

    expect(
      screen.getByPlaceholderText(/reason for rejection/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /confirm/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel/i }),
    ).toBeInTheDocument();
  });

  it("hides reject input when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<DraftReviewActions draftId="draft-1" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));
    expect(
      screen.getByPlaceholderText(/reason for rejection/i),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(
      screen.queryByPlaceholderText(/reason for rejection/i),
    ).not.toBeInTheDocument();
  });

  it("disables confirm button when reject note is empty", async () => {
    const user = userEvent.setup();
    render(<DraftReviewActions draftId="draft-1" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).toBeDisabled();
  });

  it("enables confirm button when reject note has text", async () => {
    const user = userEvent.setup();
    render(<DraftReviewActions draftId="draft-1" />);

    await user.click(screen.getByRole("button", { name: /reject/i }));

    await user.type(
      screen.getByPlaceholderText(/reason for rejection/i),
      "Missing documentation",
    );

    const confirmBtn = screen.getByRole("button", { name: /confirm/i });
    expect(confirmBtn).not.toBeDisabled();
  });
});
