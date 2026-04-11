import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PropertyGroup } from "@/components/property-group";

const mockProperties = [
  {
    id: "prop-1",
    name: "legalRights",
    description: "Legal rights under Scots law",
    schema_type: "object",
    coverage_area: "succession",
    group_id: "grp-1",
    isDraft: false,
  },
  {
    id: "prop-2",
    name: "legitim",
    description: "Children's legal share",
    schema_type: "object",
    coverage_area: "succession",
    group_id: "grp-1",
    status: "partner_draft",
    isDraft: true,
  },
];

describe("PropertyGroup", () => {
  it("renders group name as uppercase heading", () => {
    render(
      <PropertyGroup
        name="Legal Rights & Entitlements"
        description="Prior rights and legal rights"
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(
      screen.getByText("Legal Rights & Entitlements"),
    ).toBeInTheDocument();
  });

  it("renders group description", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description="Prior rights and legal rights"
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(
      screen.getByText("Prior rights and legal rights"),
    ).toBeInTheDocument();
  });

  it("renders property names in monospace", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(screen.getByText("legalRights")).toBeInTheDocument();
    expect(screen.getByText("legitim")).toBeInTheDocument();
  });

  it("shows published badge for non-draft properties", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(screen.getByText("published")).toBeInTheDocument();
  });

  it("shows draft status badge for draft properties", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(screen.getByText("partner_draft")).toBeInTheDocument();
  });

  it("shows type badges", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    const objectBadges = screen.getAllByText("object");
    expect(objectBadges).toHaveLength(2);
  });

  it("renders Edit links for each property", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    const editLinks = screen.getAllByText(/Edit/);
    expect(editLinks).toHaveLength(2);
  });

  it("shows 'No properties yet' when properties array is empty", () => {
    render(
      <PropertyGroup
        name="Empty Group"
        description={null}
        properties={[]}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(screen.getByText("No properties yet")).toBeInTheDocument();
  });

  it("renders property descriptions", () => {
    render(
      <PropertyGroup
        name="Legal Rights"
        description={null}
        properties={mockProperties}
        extensionSlug="scotland"
        coverageArea="succession"
      />,
    );
    expect(
      screen.getByText("Legal rights under Scots law"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Children's legal share"),
    ).toBeInTheDocument();
  });
});
