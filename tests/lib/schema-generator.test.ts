import { describe, it, expect } from "vitest";
import { generateExtensionSchema } from "@/lib/schema-generator";

const baseExtension = {
  slug: "scotland",
  name: "Scotland",
  schema_path: "v3/extensions/scotland",
  maturity: "candidate",
};

describe("generateExtensionSchema", () => {
  it("sets $schema, $id, title, maturity, and additionalProperties", () => {
    const result = generateExtensionSchema(baseExtension, []);
    const schema = JSON.parse(result.content);

    expect(schema.$schema).toBe(
      "https://json-schema.org/draft/2020-12/schema",
    );
    expect(schema.$id).toBe(
      "https://openinherit.org/v3/extensions/scotland/scotland.json",
    );
    expect(schema.title).toBe("Scotland Extension");
    expect(schema.description).toBe(
      "Scotland-specific estate planning properties",
    );
    expect(schema.maturity).toBe("candidate");
    expect(schema.type).toBe("object");
    expect(schema.additionalProperties).toBe(false);
  });

  it("returns the correct file path", () => {
    const result = generateExtensionSchema(baseExtension, []);
    expect(result.path).toBe("v3/extensions/scotland/scotland.json");
  });

  it("produces valid JSON with a trailing newline", () => {
    const result = generateExtensionSchema(baseExtension, []);
    expect(result.content.endsWith("\n")).toBe(true);
    expect(() => JSON.parse(result.content)).not.toThrow();
  });

  it("uses 2-space indentation", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "test_prop",
        description: "A test",
        schema_type: "string",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    // The second line should start with exactly 2 spaces (key inside root object)
    const lines = result.content.split("\n");
    const indentedLine = lines.find((l) => l.startsWith("  "));
    expect(indentedLine).toBeDefined();
  });

  it("generates empty properties when there are none", () => {
    const result = generateExtensionSchema(baseExtension, []);
    const schema = JSON.parse(result.content);
    expect(schema.properties).toEqual({});
  });

  it("converts a string property from schema_type", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "full_name",
        description: "The full legal name",
        schema_type: "string",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.full_name).toEqual({
      description: "The full legal name",
      type: "string",
    });
  });

  it("converts a number property from schema_type", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "age",
        description: null,
        schema_type: "number",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.age).toEqual({ type: "number" });
  });

  it("converts a boolean property from schema_type", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "has_will",
        description: "Whether a will exists",
        schema_type: "boolean",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.has_will).toEqual({
      description: "Whether a will exists",
      type: "boolean",
    });
  });

  it("converts an enum property to type string", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "marital_status",
        description: null,
        schema_type: "enum",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.marital_status).toEqual({ type: "string" });
  });

  it("uses schema_definition verbatim when it has content", () => {
    const customDef = {
      $ref: "../../common/money.json",
    };
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "estate_value",
        description: "Total estate value",
        schema_type: "$ref",
        schema_definition: customDef,
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.estate_value).toEqual({
      $ref: "../../common/money.json",
      description: "Total estate value",
    });
  });

  it("handles a $ref property with no description", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "tax_rule",
        description: null,
        schema_type: "$ref",
        schema_definition: { $ref: "../../common/temporal-rule.json" },
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.tax_rule).toEqual({
      $ref: "../../common/temporal-rule.json",
    });
  });

  it("handles a bare $ref schema_type with empty schema_definition", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "orphan_ref",
        description: null,
        schema_type: "$ref",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    // $ref with no definition yields an empty object (no type set)
    expect(schema.properties.orphan_ref).toEqual({});
  });

  it("handles object and array schema_types", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "address",
        description: "Postal address",
        schema_type: "object",
        schema_definition: {},
        coverage_area: "scotland",
      },
      {
        name: "beneficiaries",
        description: "List of beneficiaries",
        schema_type: "array",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.address).toEqual({
      description: "Postal address",
      type: "object",
    });
    expect(schema.properties.beneficiaries).toEqual({
      description: "List of beneficiaries",
      type: "array",
    });
  });

  it("handles multiple properties together", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "legal_rights_claimed",
        description: "Whether legal rights have been claimed",
        schema_type: "boolean",
        schema_definition: {},
        coverage_area: "scotland",
      },
      {
        name: "confirmation_granted",
        description: null,
        schema_type: "boolean",
        schema_definition: {},
        coverage_area: "scotland",
      },
      {
        name: "estate_value",
        description: "Gross estate value",
        schema_type: "$ref",
        schema_definition: { $ref: "../../common/money.json" },
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(Object.keys(schema.properties)).toHaveLength(3);
    expect(schema.properties.legal_rights_claimed.type).toBe("boolean");
    expect(schema.properties.confirmation_granted.type).toBe("boolean");
    expect(schema.properties.estate_value.$ref).toBe(
      "../../common/money.json",
    );
  });

  it("passes through an unknown schema_type as-is", () => {
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "custom_field",
        description: null,
        schema_type: "integer",
        schema_definition: {},
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.custom_field).toEqual({ type: "integer" });
  });

  it("uses a complex schema_definition with nested properties", () => {
    const complexDef = {
      type: "object",
      properties: {
        line1: { type: "string" },
        postcode: { type: "string", pattern: "^[A-Z]{1,2}\\d" },
      },
      required: ["line1", "postcode"],
    };
    const result = generateExtensionSchema(baseExtension, [
      {
        name: "address",
        description: "Scottish address",
        schema_type: "object",
        schema_definition: complexDef,
        coverage_area: "scotland",
      },
    ]);
    const schema = JSON.parse(result.content);
    expect(schema.properties.address.type).toBe("object");
    expect(schema.properties.address.properties.postcode.pattern).toBe(
      "^[A-Z]{1,2}\\d",
    );
    expect(schema.properties.address.description).toBe("Scottish address");
  });
});
