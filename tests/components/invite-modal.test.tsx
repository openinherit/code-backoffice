import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { InviteModal } from "@/components/invite-modal";

const mockExtensions = [
  { slug: "gb-ew", name: "England & Wales" },
  { slug: "gb-sc", name: "Scotland" },
];

// Mock the server action
vi.mock("@/actions/organisations", () => ({
  createOrganisation: vi.fn().mockResolvedValue({ id: "1", name: "Test Org", slug: "test-org" }),
}));

describe("InviteModal", () => {
  it("renders the invite button", () => {
    render(<InviteModal extensions={mockExtensions} />);
    expect(
      screen.getByRole("button", { name: /invite organisation/i }),
    ).toBeInTheDocument();
  });

  it("opens the modal when the button is clicked", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    expect(
      screen.getByText("Create a new partner organisation and send an invitation."),
    ).toBeInTheDocument();
  });

  it("renders all form fields in the modal", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    expect(screen.getByLabelText(/organisation name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/extension/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/succession/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tax/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/admin email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personal message/i)).toBeInTheDocument();
  });

  it("shows extension options in the dropdown", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    const select = screen.getByLabelText(/extension/i);
    expect(select).toBeInTheDocument();
    expect(screen.getByText("England & Wales")).toBeInTheDocument();
    expect(screen.getByText("Scotland")).toBeInTheDocument();
  });

  it("shows validation error when name is empty", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    await user.click(
      screen.getByRole("button", { name: /send invitation/i }),
    );

    expect(
      screen.getByText("Organisation name is required."),
    ).toBeInTheDocument();
  });

  it("shows validation error when no role is selected", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    // Fill in name and extension
    await user.type(screen.getByLabelText(/organisation name/i), "Test Org");
    await user.selectOptions(screen.getByLabelText(/extension/i), "gb-ew");
    await user.type(screen.getByLabelText(/admin email/i), "admin@test.com");

    await user.click(
      screen.getByRole("button", { name: /send invitation/i }),
    );

    expect(
      screen.getByText(
        "At least one role (Succession or Tax) must be selected.",
      ),
    ).toBeInTheDocument();
  });

  it("closes the modal when cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<InviteModal extensions={mockExtensions} />);

    await user.click(
      screen.getByRole("button", { name: /invite organisation/i }),
    );

    expect(
      screen.getByText("Create a new partner organisation and send an invitation."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(
      screen.queryByText("Create a new partner organisation and send an invitation."),
    ).not.toBeInTheDocument();
  });
});
