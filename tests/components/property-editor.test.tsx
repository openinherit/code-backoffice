import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PropertyEditor } from "@/components/property-editor";

// Mock next/navigation
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock server actions
vi.mock("@/actions/properties", () => ({
  saveDraft: vi.fn(),
}));

import { saveDraft } from "@/actions/properties";
const mockSaveDraft = vi.mocked(saveDraft);

const mockSchema = {
  type: "object",
  properties: {
    amount: { type: "number", minimum: 0 },
    currency: { type: "string", pattern: "^[A-Z]{3}$" },
    isExempt: { type: "boolean" },
    category: { type: "string", enum: ["moveable", "heritable"] },
  },
  required: ["amount", "currency"],
};

const defaultProps = {
  name: "legalRights",
  description: "Legal rights under Scots law" as string | null,
  schemaType: "object",
  schemaDefinition: mockSchema as Record<string, unknown>,
  status: "published",
  extensionId: "gb-sc",
  coverageArea: "succession",
};

describe("PropertyEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the property name", () => {
    render(<PropertyEditor {...defaultProps} />);
    expect(screen.getByText("legalRights")).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("renders the type badge", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    // "object" appears as both the type badge and in the sub-property rendering
    const objectBadges = screen.getAllByText("object");
    expect(objectBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders description when provided", () => {
    render(<PropertyEditor {...defaultProps} />);
    expect(
      screen.getByText("Legal rights under Scots law"),
    ).toBeInTheDocument();
  });

  it("renders group name when provided", () => {
    render(
      <PropertyEditor
        {...defaultProps}
        description={null}
        groupName="Legal Rights & Entitlements"
      />,
    );
    expect(
      screen.getByText("Legal Rights & Entitlements"),
    ).toBeInTheDocument();
  });

  it("renders sub-property count", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    expect(screen.getByText("Sub-properties (4)")).toBeInTheDocument();
  });

  it("renders sub-property names", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    expect(screen.getByText("amount")).toBeInTheDocument();
    expect(screen.getByText("currency")).toBeInTheDocument();
    expect(screen.getByText("isExempt")).toBeInTheDocument();
    expect(screen.getByText("category")).toBeInTheDocument();
  });

  it("marks required sub-properties", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    const requiredBadges = screen.getAllByText("required");
    expect(requiredBadges).toHaveLength(2);
  });

  it("renders empty state when no sub-properties", () => {
    render(
      <PropertyEditor
        {...defaultProps}
        description={null}
        schemaDefinition={{}}
        status="draft"
      />,
    );
    expect(
      screen.getByText("No sub-properties defined in schema"),
    ).toBeInTheDocument();
  });

  it("renders raw JSON schema in details element", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    expect(screen.getByText("View raw JSON Schema")).toBeInTheDocument();
  });

  it("renders Save as draft button", () => {
    render(<PropertyEditor {...defaultProps} description={null} />);
    expect(
      screen.getByRole("button", { name: /save as draft/i }),
    ).toBeInTheDocument();
  });

  it("renders Cancel link when backHref is provided", () => {
    render(
      <PropertyEditor
        {...defaultProps}
        description={null}
        backHref="/extensions/gb-sc/succession"
      />,
    );
    const cancelLink = screen.getByText("Cancel");
    expect(cancelLink.closest("a")).toHaveAttribute(
      "href",
      "/extensions/gb-sc/succession",
    );
  });

  it("calls saveDraft with schema data and redirects on save", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockResolvedValue({
      id: "draft-1",
      property_id: null,
      extension_id: "gb-sc",
      coverage_area: "succession",
      name: "legalRights",
      description: "Legal rights under Scots law",
      schema_type: "object",
      schema_definition: mockSchema,
      status: "draft",
      author_id: "user-1",
      reviewer_id: null,
      review_note: null,
      created_at: "2026-04-11T00:00:00Z",
      updated_at: "2026-04-11T00:00:00Z",
    });

    render(
      <PropertyEditor
        {...defaultProps}
        backHref="/extensions/gb-sc/succession"
      />,
    );

    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          extensionId: "gb-sc",
          coverageArea: "succession",
          name: "legalRights",
          schemaType: "object",
        }),
      );
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/extensions/gb-sc/succession");
    });
  });

  it("shows error message when saveDraft fails", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockRejectedValue(new Error("Database error"));

    render(<PropertyEditor {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => {
      expect(screen.getByText("Database error")).toBeInTheDocument();
    });
  });

  it("passes propertyId to saveDraft when provided", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockResolvedValue({
      id: "draft-1",
      property_id: "prop-1",
      extension_id: "gb-sc",
      coverage_area: "succession",
      name: "legalRights",
      description: "Legal rights under Scots law",
      schema_type: "object",
      schema_definition: mockSchema,
      status: "draft",
      author_id: "user-1",
      reviewer_id: null,
      review_note: null,
      created_at: "2026-04-11T00:00:00Z",
      updated_at: "2026-04-11T00:00:00Z",
    });

    render(
      <PropertyEditor
        {...defaultProps}
        propertyId="prop-1"
        backHref="/extensions/gb-sc/succession"
      />,
    );

    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => {
      expect(mockSaveDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          propertyId: "prop-1",
        }),
      );
    });
  });

  it("redirects to extension page when no backHref is provided", async () => {
    const user = userEvent.setup();
    mockSaveDraft.mockResolvedValue({
      id: "draft-1",
      property_id: null,
      extension_id: "gb-sc",
      coverage_area: "succession",
      name: "legalRights",
      description: "Legal rights under Scots law",
      schema_type: "object",
      schema_definition: mockSchema,
      status: "draft",
      author_id: "user-1",
      reviewer_id: null,
      review_note: null,
      created_at: "2026-04-11T00:00:00Z",
      updated_at: "2026-04-11T00:00:00Z",
    });

    render(<PropertyEditor {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/extensions/gb-sc/succession");
    });
  });
});
