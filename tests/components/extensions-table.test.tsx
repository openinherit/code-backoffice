import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExtensionsTable } from "@/components/extensions-table";
import type { ListExtension } from "@/actions/extensions";

const mockExtensions: ListExtension[] = [
  {
    slug: "gb-ew",
    name: "England & Wales",
    legal_tradition: "Common Law",
    extension_type: "geographic",
    key_features: "Probate, IHT thresholds, trusts",
    maturity: "stable",
    metadata: {},
    properties: [
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "succession" },
      { coverage_area: "tax" },
      { coverage_area: "tax" },
      { coverage_area: "tax" },
      { coverage_area: "tax" },
    ],
  },
  {
    slug: "gb-sc",
    name: "Scotland",
    legal_tradition: "Mixed",
    extension_type: "geographic",
    key_features: "Legal rights, confirmation",
    maturity: "candidate",
    metadata: { seeking: "Tax specialists" },
    properties: [
      { coverage_area: "succession" },
      { coverage_area: "tax" },
    ],
  },
  {
    slug: "islamic-succession",
    name: "Islamic Succession",
    legal_tradition: null,
    extension_type: "tradition",
    key_features: null,
    maturity: "draft",
    metadata: {},
    properties: [],
  },
];

describe("ExtensionsTable", () => {
  it("renders extension names as links", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("England & Wales")).toBeInTheDocument();
    expect(screen.getByText("Scotland")).toBeInTheDocument();
    expect(screen.getByText("Islamic Succession")).toBeInTheDocument();

    const ewLink = screen.getByText("England & Wales").closest("a");
    expect(ewLink).toHaveAttribute("href", "/extensions/gb-ew");
  });

  it("renders type badges", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    const geoBadges = screen.getAllByText("geographic");
    expect(geoBadges).toHaveLength(2);
    expect(screen.getByText("tradition")).toBeInTheDocument();
  });

  it("shows the total count in the footer", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("3 extensions total")).toBeInTheDocument();
  });

  it("shows em-dash for null legal_tradition and key_features", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    // Islamic Succession has null legal_tradition, key_features, and no
    // properties in either coverage area, plus no seeking — so 5 dashes
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });

  it("renders an empty table when no extensions are provided", () => {
    render(<ExtensionsTable extensions={[]} />);
    expect(screen.getByText("0 extensions total")).toBeInTheDocument();
  });

  it("shows succession and tax property counts with edit links", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);

    // England & Wales has 7 succession, 4 tax
    expect(screen.getByText("7 props")).toBeInTheDocument();
    expect(screen.getByText("4 props")).toBeInTheDocument();

    // Scotland has 1 succession, 1 tax — singular
    expect(screen.getAllByText("1 prop")).toHaveLength(2);

    // Edit links
    const successionLinks = screen.getAllByText("Edit succession →");
    expect(successionLinks).toHaveLength(2);
    expect(successionLinks[0].closest("a")).toHaveAttribute(
      "href",
      "/extensions/gb-ew/succession",
    );

    const taxLinks = screen.getAllByText("Edit tax →");
    expect(taxLinks).toHaveLength(2);
    expect(taxLinks[0].closest("a")).toHaveAttribute(
      "href",
      "/extensions/gb-ew/tax",
    );
  });

  it("shows em-dash for extensions with no properties", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    // Islamic Succession has 0 in both columns — should show "—" not "0 props"
    expect(screen.queryByText("0 props")).not.toBeInTheDocument();
  });

  it("shows seeking text when present in metadata", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    expect(screen.getByText("Tax specialists")).toBeInTheDocument();
  });

  it("shows publish drafts link when drafts exist", () => {
    render(<ExtensionsTable extensions={mockExtensions} />);
    // 1 draft extension (Islamic Succession)
    const publishLink = screen.getByText("Publish 1 draft → Create PR");
    expect(publishLink).toBeInTheDocument();
    expect(publishLink.closest("a")).toHaveAttribute("href", "/publish");
  });

  it("hides publish link when no drafts exist", () => {
    const noDrafts: ListExtension[] = [
      {
        slug: "gb-ew",
        name: "England & Wales",
        legal_tradition: "Common Law",
        extension_type: "geographic",
        key_features: "Probate",
        maturity: "stable",
        metadata: {},
        properties: [],
      },
    ];
    render(<ExtensionsTable extensions={noDrafts} />);
    expect(screen.queryByText(/Publish/)).not.toBeInTheDocument();
  });
});
