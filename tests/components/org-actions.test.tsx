import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { OrgActions } from "@/components/org-actions";

describe("OrgActions", () => {
  it("renders the add assignment button", () => {
    render(<OrgActions orgId="org-1" orgSlug="test-org" />);
    expect(
      screen.getByRole("button", { name: /add assignment/i }),
    ).toBeInTheDocument();
  });

  it("renders the add assignment button as disabled", () => {
    render(<OrgActions orgId="org-1" orgSlug="test-org" />);
    expect(
      screen.getByRole("button", { name: /add assignment/i }),
    ).toBeDisabled();
  });
});
