import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PropertyEditor } from "@/components/property-editor";

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

describe("PropertyEditor", () => {
  it("renders the property name", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description="Legal rights under Scots law"
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(screen.getByText("legalRights")).toBeInTheDocument();
  });

  it("renders the status badge", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("renders the type badge", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    // "object" appears as both the type badge and in the sub-property rendering
    const objectBadges = screen.getAllByText("object");
    expect(objectBadges.length).toBeGreaterThanOrEqual(1);
  });

  it("renders description when provided", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description="Legal rights under Scots law"
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(
      screen.getByText("Legal rights under Scots law"),
    ).toBeInTheDocument();
  });

  it("renders group name when provided", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
        groupName="Legal Rights & Entitlements"
      />,
    );
    expect(
      screen.getByText("Legal Rights & Entitlements"),
    ).toBeInTheDocument();
  });

  it("renders sub-property count", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(screen.getByText("Sub-properties (4)")).toBeInTheDocument();
  });

  it("renders sub-property names", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(screen.getByText("amount")).toBeInTheDocument();
    expect(screen.getByText("currency")).toBeInTheDocument();
    expect(screen.getByText("isExempt")).toBeInTheDocument();
    expect(screen.getByText("category")).toBeInTheDocument();
  });

  it("marks required sub-properties", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    const requiredBadges = screen.getAllByText("required");
    expect(requiredBadges).toHaveLength(2);
  });

  it("renders empty state when no sub-properties", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={{}}
        status="draft"
      />,
    );
    expect(
      screen.getByText("No sub-properties defined in schema"),
    ).toBeInTheDocument();
  });

  it("renders raw JSON schema in details element", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(screen.getByText("View raw JSON Schema")).toBeInTheDocument();
  });

  it("renders Save as draft button", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
      />,
    );
    expect(
      screen.getByRole("button", { name: /save as draft/i }),
    ).toBeInTheDocument();
  });

  it("renders Cancel link when backHref is provided", () => {
    render(
      <PropertyEditor
        name="legalRights"
        description={null}
        schemaType="object"
        schemaDefinition={mockSchema}
        status="published"
        backHref="/extensions/gb-sc/succession"
      />,
    );
    const cancelLink = screen.getByText("Cancel");
    expect(cancelLink.closest("a")).toHaveAttribute(
      "href",
      "/extensions/gb-sc/succession",
    );
  });
});
