// Schema Generator — converts property drafts into valid JSON Schema files
// for the openinherit/standard repo (v3/extensions/{slug}/{slug}.json).
//
// When the target file already exists, the generator MERGES into it: it
// writes only `properties.<name>` for the properties it is given and keeps
// every other key, value and key order. The published files carry keys this
// generator never emits (required, $defs, patternProperties,
// unevaluatedProperties, dataProvenance, ...), so replacing the file would
// delete them from the public standard.

export type Extension = {
  slug: string;
  name: string;
  schema_path: string;
  maturity: string;
};

export type Property = {
  name: string;
  description: string | null;
  schema_type: string;
  schema_definition: Record<string, unknown>;
  coverage_area: string;
};

/** The target file for an extension: `<schema_path>/<slug>.json`. */
export function extensionSchemaPath(extension: Pick<Extension, "slug" | "schema_path">): string {
  // Strip trailing slash from schema_path to avoid double-slash in paths
  return `${extension.schema_path.replace(/\/+$/, "")}/${extension.slug}.json`;
}

export type SchemaFile = {
  path: string; // e.g. "v3/extensions/scotland/scotland.json"
  content: string; // JSON string (2-space indent, trailing newline)
};

/**
 * Build a JSON Schema Draft 2020-12 file from an extension and its properties.
 *
 * `existingContent` is the current file in the target repo, or null when
 * there is none. When given, the result is that file with only the listed
 * properties added or replaced.
 */
export function generateExtensionSchema(
  extension: Extension,
  properties: Property[],
  existingContent: string | null = null,
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

  // Strip trailing slash from schema_path to avoid double-slash in paths
  const basePath = extension.schema_path.replace(/\/+$/, "");

  const path = extensionSchemaPath(extension);

  if (existingContent !== null) {
    return { path, content: mergeIntoExisting(path, existingContent, props) };
  }

  const schema: Record<string, unknown> = {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `https://openinherit.org/${basePath}/${extension.slug}.json`,
    title: `${extension.name} Extension`,
    description: `${extension.name}-specific estate planning properties`,
    maturity: extension.maturity,
    type: "object",
    properties: props,
    additionalProperties: false,
  };

  return {
    path,
    content: JSON.stringify(schema, null, 2) + "\n",
  };
}

function mergeIntoExisting(
  path: string,
  existingContent: string,
  props: Record<string, unknown>,
): string {
  let existing: unknown;
  try {
    existing = JSON.parse(existingContent);
  } catch {
    throw new Error(`${path} in the target repo is not valid JSON; refusing to replace it`);
  }
  if (typeof existing !== "object" || existing === null || Array.isArray(existing)) {
    throw new Error(`${path} in the target repo is not a JSON object; refusing to replace it`);
  }
  if (Object.keys(props).length === 0) return existingContent;

  const schema = existing as Record<string, unknown>;
  const current = schema.properties;
  const currentProps =
    typeof current === "object" && current !== null && !Array.isArray(current)
      ? (current as Record<string, unknown>)
      : {};
  // Assigning onto the parsed object keeps the existing key order.
  schema.properties = { ...currentProps, ...props };
  return JSON.stringify(schema, null, 2) + "\n";
}

/**
 * Choose what to write for one extension. Into an existing file only the
 * drafts are merged: the DB's copies of published properties may be stale,
 * and the target file is the source of truth for them. A brand-new file gets
 * the published properties plus the drafts, drafts winning on a name clash.
 */
export function buildPublishFile(
  extension: Extension,
  published: Property[],
  drafts: Property[],
  existingContent: string | null,
): SchemaFile {
  if (existingContent !== null) {
    return generateExtensionSchema(extension, drafts, existingContent);
  }
  const byName = new Map<string, Property>();
  for (const p of [...published, ...drafts]) byName.set(p.name, p);
  return generateExtensionSchema(extension, Array.from(byName.values()), null);
}
