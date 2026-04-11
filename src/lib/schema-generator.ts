// Schema Generator — converts property drafts into valid JSON Schema files
// for the openinherit/standard repo (v3/extensions/{slug}/{slug}.json).

export type SchemaFile = {
  path: string; // e.g. "v3/extensions/scotland/scotland.json"
  content: string; // JSON string (2-space indent, trailing newline)
};

/**
 * Build a JSON Schema Draft 2020-12 file from an extension and its properties.
 */
export function generateExtensionSchema(
  extension: {
    slug: string;
    name: string;
    schema_path: string;
    maturity: string;
  },
  properties: Array<{
    name: string;
    description: string | null;
    schema_type: string;
    schema_definition: Record<string, unknown>;
    coverage_area: string;
  }>,
): SchemaFile {
  const props: Record<string, unknown> = {};

  for (const prop of properties) {
    if (
      prop.schema_definition &&
      Object.keys(prop.schema_definition).length > 0
    ) {
      // schema_definition already holds the full sub-schema (e.g. a $ref,
      // an enum list, or a complex object). Merge the description in.
      props[prop.name] = {
        ...prop.schema_definition,
        ...(prop.description ? { description: prop.description } : {}),
      };
    } else {
      // Build a minimal sub-schema from schema_type.
      const schemaProp: Record<string, unknown> = {};
      if (prop.description) schemaProp.description = prop.description;

      switch (prop.schema_type) {
        case "string":
          schemaProp.type = "string";
          break;
        case "number":
          schemaProp.type = "number";
          break;
        case "boolean":
          schemaProp.type = "boolean";
          break;
        case "object":
          schemaProp.type = "object";
          break;
        case "array":
          schemaProp.type = "array";
          break;
        case "enum":
          // enums are string type — the enum array comes from schema_definition
          schemaProp.type = "string";
          break;
        case "$ref":
          // $ref is handled entirely by schema_definition; nothing to add
          break;
        default:
          schemaProp.type = prop.schema_type;
      }

      props[prop.name] = schemaProp;
    }
  }

  const schema: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://openinherit.org/${extension.schema_path}/${extension.slug}.json`,
    title: `${extension.name} Extension`,
    description: `${extension.name}-specific estate planning properties`,
    maturity: extension.maturity,
    type: "object",
    properties: props,
    additionalProperties: false,
  };

  return {
    path: `${extension.schema_path}/${extension.slug}.json`,
    content: JSON.stringify(schema, null, 2) + "\n",
  };
}
