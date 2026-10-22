import { describe, it, expect } from "vitest";
import { buildPublishFile, generateExtensionSchema } from "@/lib/schema-generator";

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

// ------------------------------------------------------------------
// Merging into an existing target file. The published extension files
// carry keys this generator never emits (required, $defs,
// patternProperties, unevaluatedProperties, dataProvenance, ...).
// Replacing the file would delete them from the public standard.
// ------------------------------------------------------------------

const existingFile = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://openinherit.org/v3/extensions/scotland/scotland.json",
  title: "Scotland — Succession Law Extension",
  description: "Scots law succession properties",
  $comment: "hand-authored",
  maturity: "draft",
  dataProvenance: { source: "statute" },
  type: "object",
  properties: {
    priorRights: { type: "object", description: "Prior rights" },
    legalRights: { type: "boolean" },
  },
  required: ["priorRights"],
  $defs: { claim: { type: "string" } },
  patternProperties: { "^x-": {} },
  unevaluatedProperties: false,
};
const existingContent = JSON.stringify(existingFile, null, 2) + "\n";

function withoutProperties(schema: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(schema).filter(([k]) => k !== "properties"));
}

const draft = {
  name: "cohabitationClaim",
  description: "A cohabitant's claim",
  schema_type: "boolean",
  schema_definition: {},
  coverage_area: "scotland",
};

describe("generateExtensionSchema — merging into an existing file", () => {
  it("is a no-op when there are no properties to publish", () => {
    const result = generateExtensionSchema(baseExtension, [], existingContent);
    expect(result.content).toBe(existingContent);
  });

  it("keeps every top-level key it does not own, with its value", () => {
    const result = generateExtensionSchema(baseExtension, [draft], existingContent);
    const schema = JSON.parse(result.content);
    expect(withoutProperties(schema)).toEqual(withoutProperties(existingFile));
  });

  it("keeps the existing key order", () => {
    const result = generateExtensionSchema(baseExtension, [draft], existingContent);
    expect(Object.keys(JSON.parse(result.content))).toEqual(Object.keys(existingFile));
  });

  it("does not add keys the existing file lacks (no additionalProperties)", () => {
    const result = generateExtensionSchema(baseExtension, [draft], existingContent);
    expect(JSON.parse(result.content)).not.toHaveProperty("additionalProperties");
  });

  it("does not overwrite title, description or maturity from the DB row", () => {
    const result = generateExtensionSchema(
      { ...baseExtension, maturity: "stable" },
      [draft],
      existingContent,
    );
    const schema = JSON.parse(result.content);
    expect(schema.title).toBe(existingFile.title);
    expect(schema.description).toBe(existingFile.description);
    expect(schema.maturity).toBe("draft");
  });

  it("adds a new property and leaves the others untouched", () => {
    const result = generateExtensionSchema(baseExtension, [draft], existingContent);
    const schema = JSON.parse(result.content);
    expect(schema.properties).toEqual({
      ...existingFile.properties,
      cohabitationClaim: { description: "A cohabitant's claim", type: "boolean" },
    });
  });

  it("replaces only the named property when it already exists", () => {
    const result = generateExtensionSchema(
      baseExtension,
      [{ ...draft, name: "legalRights", description: "Legal rights", schema_type: "string" }],
      existingContent,
    );
    const schema = JSON.parse(result.content);
    expect(schema.properties.legalRights).toEqual({ description: "Legal rights", type: "string" });
    expect(schema.properties.priorRights).toEqual(existingFile.properties.priorRights);
  });

  it("creates a properties object when the existing file has none", () => {
    const noProps = withoutProperties(existingFile);
    const result = generateExtensionSchema(
      baseExtension,
      [draft],
      JSON.stringify(noProps, null, 2) + "\n",
    );
    expect(JSON.parse(result.content).properties).toEqual({
      cohabitationClaim: { description: "A cohabitant's claim", type: "boolean" },
    });
  });

  it("refuses an existing file that is not JSON rather than replacing it", () => {
    expect(() => generateExtensionSchema(baseExtension, [draft], "{not json")).toThrow(
      /not valid JSON/,
    );
  });

  it("refuses an existing file that is not a JSON object", () => {
    expect(() => generateExtensionSchema(baseExtension, [draft], "[]")).toThrow(
      /not a JSON object/,
    );
  });

  it("still generates a whole new file when there is no existing file", () => {
    const result = generateExtensionSchema(baseExtension, [draft], null);
    const schema = JSON.parse(result.content);
    expect(schema.title).toBe("Scotland Extension");
    expect(schema.additionalProperties).toBe(false);
  });
});

describe("buildPublishFile — which properties go into the file", () => {
  const published = [
    { ...draft, name: "priorRights", description: "DB copy, possibly stale", schema_type: "string" },
  ];

  it("merges only the drafts into an existing file, never the DB's published copies", () => {
    const result = buildPublishFile(baseExtension, published, [draft], existingContent);
    const schema = JSON.parse(result.content);
    expect(schema.properties.priorRights).toEqual(existingFile.properties.priorRights);
    expect(schema.properties.cohabitationClaim).toBeDefined();
  });

  it("writes published properties and drafts into a brand-new file", () => {
    const result = buildPublishFile(baseExtension, published, [draft], null);
    const schema = JSON.parse(result.content);
    expect(Object.keys(schema.properties)).toEqual(["priorRights", "cohabitationClaim"]);
  });

  it("lets a draft override a published property of the same name in a new file", () => {
    const result = buildPublishFile(
      baseExtension,
      published,
      [{ ...draft, name: "priorRights", schema_type: "boolean" }],
      null,
    );
    expect(JSON.parse(result.content).properties.priorRights.type).toBe("boolean");
  });
});
