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

  it("renders enum values listed below the select", () => {
    render(
      <TypeInput
        name="category"
        schema={{ enum: ["moveable", "heritable"] }}
      />,
    );
    // Values are listed below the select as well
    const moveableEls = screen.getAllByText("moveable");
    expect(moveableEls.length).toBeGreaterThanOrEqual(2); // option + list item
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
        schema={{ $ref: "#/$defs/general.json" }}
      />,
    );
    expect(screen.getByText("amount")).toBeInTheDocument();
    expect(screen.getByText("$ref: #/$defs/general.json")).toBeInTheDocument();
  });

  it("renders money $ref with amount and currency inputs", () => {
    render(
      <TypeInput
        name="nilRateBand"
        schema={{ $ref: "#/$defs/money.json" }}
      />,
    );
    expect(screen.getByText("nilRateBand")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Amount")).toBeInTheDocument();
    expect(screen.getByText("GBP")).toBeInTheDocument();
    expect(screen.getByText("EUR")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("renders temporal-rule $ref with edit link", () => {
    render(
      <TypeInput
        name="applicability"
        schema={{ $ref: "#/$defs/temporal-rule.json" }}
      />,
    );
    expect(screen.getByText("applicability")).toBeInTheDocument();
    expect(screen.getByText(/Edit temporal rule/)).toBeInTheDocument();
  });

  it("renders unknown type gracefully", () => {
    render(<TypeInput name="mystery" schema={{}} />);
    expect(screen.getByText("mystery")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("renders string inputs as editable", () => {
    render(
      <TypeInput name="title" schema={{ type: "string" }} />,
    );
    const input = screen.getByPlaceholderText("string");
    expect(input).not.toHaveAttribute("readOnly");
    expect(input).not.toBeDisabled();
  });

  it("renders boolean radios as enabled", () => {
    render(<TypeInput name="exempt" schema={{ type: "boolean" }} />);
    const radios = screen.getAllByRole("radio");
    for (const radio of radios) {
      expect(radio).not.toBeDisabled();
    }
  });
});
