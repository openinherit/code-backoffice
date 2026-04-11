import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AddPropertyWizard } from "@/components/add-property-wizard";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions/properties", () => ({
  saveDraft: vi.fn(),
  listSharedDefinitions: vi.fn().mockResolvedValue([]),
}));

import { saveDraft } from "@/actions/properties";
const mockSaveDraft = vi.mocked(saveDraft);

const mockGroups = [
  {
    id: "grp-1",
    name: "Legal Rights & Entitlements",
    description: "Prior rights and legal rights",
    display_order: 1,
  },
  {
    id: "grp-2",
    name: "Distribution Rules",
    description: "How the estate is distributed",
    display_order: 2,
  },
];

describe("AddPropertyWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders step 1 with name input, description, group dropdown, and type cards", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    expect(screen.getByLabelText("Property name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Property group")).toBeInTheDocument();
    expect(screen.getByText("Object")).toBeInTheDocument();
    expect(screen.getByText("String")).toBeInTheDocument();
    expect(screen.getByText("Enum")).toBeInTheDocument();
    expect(screen.getByText("Boolean")).toBeInTheDocument();
    expect(screen.getByText("Number")).toBeInTheDocument();
    expect(screen.getByText("Array")).toBeInTheDocument();
    expect(screen.getByText("$ref")).toBeInTheDocument();
  });

  it("renders breadcrumb with coverage area", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    expect(screen.getByText("Succession Rules")).toBeInTheDocument();
    expect(screen.getByText("New property")).toBeInTheDocument();
  });

  it("shows group options in dropdown", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    const select = screen.getByLabelText("Property group");
    expect(select).toBeInTheDocument();
    expect(
      screen.getByText("Legal Rights & Entitlements"),
    ).toBeInTheDocument();
    expect(screen.getByText("Distribution Rules")).toBeInTheDocument();
  });

  it("disables Next button when name is empty", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    const nextBtn = screen.getByRole("button", { name: /Next: Configure/ });
    expect(nextBtn).toBeDisabled();
  });

  it("enables Next button when name is filled", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "legalRights");
    const nextBtn = screen.getByRole("button", { name: /Next: Configure/ });
    expect(nextBtn).not.toBeDisabled();
  });

  it("advances to step 2 when Next is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "legalRights");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    // Step 2 shows "Back to Name & Type" and JSON Schema preview
    expect(screen.getByText(/Back to Name & Type/)).toBeInTheDocument();
    expect(screen.getByText("JSON Schema preview")).toBeInTheDocument();
  });

  it("shows object configurator with sub-property builder on step 2", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "legalRights");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("Sub-properties")).toBeInTheDocument();
    expect(screen.getByText("+ Add sub-property")).toBeInTheDocument();
  });

  it("navigates back to step 1 when Back is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "test");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );
    await user.click(screen.getByText(/Back to Name & Type/));

    expect(screen.getByLabelText("Property name")).toBeInTheDocument();
  });

  it("shows enum editor when Enum type is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "status");
    await user.click(screen.getByText("Enum"));
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("+ Add value")).toBeInTheDocument();
    expect(screen.getByText(/Naming convention/)).toBeInTheDocument();
  });

  it("shows string constraints when String type is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "name");
    await user.click(screen.getByText("String"));
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("String constraints")).toBeInTheDocument();
    expect(screen.getByLabelText("Max length")).toBeInTheDocument();
    expect(screen.getByLabelText("Format")).toBeInTheDocument();
  });

  it("shows number constraints when Number type is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "sharePercentage");
    await user.click(screen.getByText("Number"));
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("Number constraints")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum")).toBeInTheDocument();
  });

  it("shows boolean message when Boolean type is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "isApplicable");
    await user.click(screen.getByText("Boolean"));
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(
      screen.getByText(/Boolean properties have no additional configuration/),
    ).toBeInTheDocument();
  });

  it("shows array configurator when Array type is selected", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "beneficiaries");
    await user.click(screen.getByText("Array"));
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("Array configuration")).toBeInTheDocument();
    expect(screen.getByLabelText("Item type")).toBeInTheDocument();
  });

  it("renders JSON Schema preview on step 2", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(
      screen.getByLabelText("Property name"),
      "testProp",
    );
    await user.type(screen.getByLabelText("Description"), "A test property");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    const preview = screen.getByText("JSON Schema preview")
      .nextElementSibling;
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toContain('"type": "object"');
    expect(preview?.textContent).toContain('"description": "A test property"');
  });

  it("calls saveDraft and redirects on save", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockResolvedValue({
      id: "draft-1",
      property_id: null,
      extension_id: "scotland",
      coverage_area: "succession",
      name: "legalRights",
      description: "Test",
      schema_type: "object",
      schema_definition: {},
      status: "partner_draft",
      author_id: "user-1",
      reviewer_id: null,
      review_note: null,
      created_at: "2026-04-11T00:00:00Z",
      updated_at: "2026-04-11T00:00:00Z",
    });

    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "legalRights");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );
    await user.click(screen.getByRole("button", { name: /Save as draft/ }));

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: "scotland",
          coverageArea: "succession",
          name: "legalRights",
          schemaType: "object",
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/extensions/scotland/succession",
      );
    });
  });

  it("shows error when saveDraft fails", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockRejectedValue(new Error("Database error"));

    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "test");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );
    await user.click(screen.getByRole("button", { name: /Save as draft/ }));

    await waitFor(() => {
      expect(screen.getByText("Database error")).toBeInTheDocument();
    });
  });

  it("navigates back to coverage page when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    await user.type(screen.getByLabelText("Property name"), "test");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(mockPush).toHaveBeenCalledWith(
      "/extensions/scotland/succession",
    );
  });

  it("shows step indicator with correct active step", async () => {
    const user = userEvent.setup();
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    expect(screen.getByText("Name & Type")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Property name"), "test");
    await user.click(
      screen.getByRole("button", { name: /Next: Configure/ }),
    );

    expect(screen.getByText("Configure")).toBeInTheDocument();
  });

  it("hides group dropdown when no groups exist", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="tax"
        groups={[]}
      />,
    );

    expect(screen.queryByLabelText("Property group")).not.toBeInTheDocument();
  });

  it("renders camelCase guidance text", () => {
    render(
      <AddPropertyWizard
        extensionSlug="scotland"
        coverageArea="succession"
        groups={mockGroups}
      />,
    );

    expect(screen.getByText(/camelCase/)).toBeInTheDocument();
  });
});
