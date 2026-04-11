import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExtensionsTable } from "@/components/extensions-table";

const mockExtensions = [
  {
    slug: "gb-ew",
    name: "England & Wales",
    legal_tradition: "Common Law",
    extension_type: "geographic",
    key_features: "Probate, IHT thresholds, trusts",
    maturity: "stable",
  },
  {
    slug: "gb-sc",
    name: "Scotland",
    legal_tradition: "Mixed",
    extension_type: "geographic",
    key_features: "Legal rights, confirmation",
    maturity: "candidate",
  },
  {
    slug: "islamic-succession",
    name: "Islamic Succession",
    legal_tradition: null,
    extension_type: "tradition",
    key_features: null,
    maturity: "draft",
  },
];

describe("ExtensionsTable", () => {
  it("renders extension names", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("England & Wales")).toBeInTheDocument();
    expect(screen.getByText("Scotland")).toBeInTheDocument();
    expect(screen.getByText("Islamic Succession")).toBeInTheDocument();
  });

  it("renders type badges", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    const geoBadges = screen.getAllByText("geographic");
    expect(geoBadges).toHaveLength(2);
    expect(screen.getByText("tradition")).toBeInTheDocument();
  });

  it("renders maturity badges", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("stable")).toBeInTheDocument();
    expect(screen.getByText("candidate")).toBeInTheDocument();
    expect(screen.getByText("draft")).toBeInTheDocument();
  });

  it("shows the total count in the footer", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("3 extensions total")).toBeInTheDocument();
  });

  it("shows em-dash for null legal_tradition and key_features", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    // Islamic Succession has null legal_tradition and key_features
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders an empty table when no extensions are provided", () => {
    render(<ExtensionsTable extensions={[]} />);
    expect(screen.getByText("0 extensions total")).toBeInTheDocument();
  });
});
