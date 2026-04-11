import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TypeInput } from "@/components/type-input";

describe("TypeInput", () => {
  it("renders a string input with format hint", () => {
    render(
      <TypeInput name="effectiveFrom" schema={{ type: "string", format: "date" }} />,
    );
    expect(screen.getByText("effectiveFrom")).toBeInTheDocument();
    expect(screen.getByText("(date)")).toBeInTheDocument();
  });

  it("renders a number input with range placeholder", () => {
    render(
      <TypeInput
        name="value"
        schema={{ type: "number", minimum: 0, maximum: 100 }}
      />,
    );
    expect(screen.getByText("value")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("0 – 100")).toBeInTheDocument();
  });

  it("renders boolean as radio buttons", () => {
    render(<TypeInput name="isExempt" schema={{ type: "boolean" }} />);
    expect(screen.getByText("isExempt")).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
  });

  it("renders enum as select with options", () => {
    render(
      <TypeInput
        name="category"
        schema={{ enum: ["moveable", "heritable"] }}
      />,
    );
    expect(screen.getByText("category")).toBeInTheDocument();
    const options = screen.getAllByRole("option");
    // "Select..." + 2 enum values
    expect(options).toHaveLength(3);
  });

  it("renders array type with item description", () => {
    render(
      <TypeInput
        name="items"
        schema={{ type: "array", items: { type: "string" } }}
      />,
    );
    expect(screen.getByText("items")).toBeInTheDocument();
    expect(screen.getByText("Items: string")).toBeInTheDocument();
  });

  it("renders object type with nested properties", () => {
    render(
      <TypeInput
        name="address"
        schema={{
          type: "object",
          properties: {
            line1: { type: "string" },
            city: { type: "string" },
          },
        }}
      />,
    );
    expect(screen.getByText("address")).toBeInTheDocument();
    expect(screen.getByText("line1")).toBeInTheDocument();
    expect(screen.getByText("city")).toBeInTheDocument();
  });

  it("renders $ref type", () => {
    render(
      <TypeInput
        name="amount"
        schema={{ $ref: "#/$defs/money.json" }}
      />,
    );
    expect(screen.getByText("amount")).toBeInTheDocument();
    expect(screen.getByText("$ref: #/$defs/money.json")).toBeInTheDocument();
  });

  it("renders unknown type gracefully", () => {
    render(<TypeInput name="mystery" schema={{}} />);
    expect(screen.getByText("mystery")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });
});
