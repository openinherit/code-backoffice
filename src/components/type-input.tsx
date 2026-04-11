type SubProperty = {
  name: string;
  schema: Record<string, unknown>;
};

function resolveType(schema: Record<string, unknown>): string {
  if (typeof schema.type === "string") return schema.type;
  if (schema.enum) return "enum";
  if (schema.$ref) return "$ref";
  return "unknown";
}

function StringDisplay({ name, schema }: SubProperty) {
  const format = schema.format as string | undefined;
  const pattern = schema.pattern as string | undefined;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700">
          {name}
          {format && (
            <span className="ml-1 text-[10px] text-gray-400">({format})</span>
          )}
        </label>
        <input
          type="text"
          readOnly
          placeholder={
            pattern ? `Pattern: ${pattern}` : format ?? "string"
          }
          className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500"
        />
      </div>
    </div>
  );
}

function NumberDisplay({ name, schema }: SubProperty) {
  const min = schema.minimum as number | undefined;
  const max = schema.maximum as number | undefined;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700">
          {name}
        </label>
        <input
          type="number"
          readOnly
          placeholder={
            min !== undefined || max !== undefined
              ? `${min ?? "..."} – ${max ?? "..."}`
              : "number"
          }
          className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500"
        />
      </div>
    </div>
  );
}

function BooleanDisplay({ name }: { name: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <div className="mt-1 flex gap-3">
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input
            type="radio"
            name={name}
            disabled
            className="h-3 w-3"
          />
          true
        </label>
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input
            type="radio"
            name={name}
            disabled
            className="h-3 w-3"
          />
          false
        </label>
      </div>
    </div>
  );
}

function EnumDisplay({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, unknown>;
}) {
  const values = (schema.enum as string[]) ?? [];

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <select
        disabled
        className="mt-1 w-full rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500"
      >
        <option value="">Select...</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </select>
    </div>
  );
}

function ArrayDisplay({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, unknown>;
}) {
  const items = schema.items as Record<string, unknown> | undefined;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">
        {name}
        <span className="ml-1 text-[10px] text-gray-400">(array)</span>
      </label>
      <div className="mt-1 rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-400">
        {items ? (
          <span>Items: {resolveType(items)}</span>
        ) : (
          <span>Array (no item schema defined)</span>
        )}
      </div>
    </div>
  );
}

function ObjectDisplay({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, unknown>;
}) {
  const properties = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
  const entries = Object.entries(properties);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">
        {name}
        <span className="ml-1 text-[10px] text-gray-400">(object)</span>
      </label>
      {entries.length > 0 ? (
        <div className="mt-1 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
          {entries.map(([key, subSchema]) => (
            <TypeInput key={key} name={key} schema={subSchema} />
          ))}
        </div>
      ) : (
        <div className="mt-1 rounded border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-xs text-gray-400">
          Empty object
        </div>
      )}
    </div>
  );
}

function RefDisplay({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, unknown>;
}) {
  const ref = schema.$ref as string;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <div className="mt-1 rounded border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2 text-xs text-indigo-600">
        $ref: {ref}
      </div>
    </div>
  );
}

export function TypeInput({
  name,
  schema,
}: {
  name: string;
  schema: Record<string, unknown>;
}) {
  const type = resolveType(schema);

  switch (type) {
    case "string":
      return <StringDisplay name={name} schema={schema} />;
    case "number":
    case "integer":
      return <NumberDisplay name={name} schema={schema} />;
    case "boolean":
      return <BooleanDisplay name={name} />;
    case "enum":
      return <EnumDisplay name={name} schema={schema} />;
    case "array":
      return <ArrayDisplay name={name} schema={schema} />;
    case "object":
      return <ObjectDisplay name={name} schema={schema} />;
    case "$ref":
      return <RefDisplay name={name} schema={schema} />;
    default:
      return (
        <div>
          <label className="block text-xs font-medium text-gray-700">
            {name}
          </label>
          <div className="mt-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-400">
            {type}
          </div>
        </div>
      );
  }
}
