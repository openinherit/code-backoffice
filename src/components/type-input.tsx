type SubProperty = {
  name: string;
  schema: Record<string, unknown>;
  value?: unknown;
  onChange?: (value: unknown) => void;
};

function resolveType(schema: Record<string, unknown>): string {
  if (typeof schema.type === "string") return schema.type;
  if (schema.enum) return "enum";
  if (schema.$ref) return "$ref";
  return "unknown";
}

function isMoneyRef(schema: Record<string, unknown>): boolean {
  return typeof schema.$ref === "string" && schema.$ref.includes("money");
}

function isTemporalRuleRef(schema: Record<string, unknown>): boolean {
  return (
    typeof schema.$ref === "string" && schema.$ref.includes("temporal-rule")
  );
}

function StringDisplay({ name, schema, value, onChange }: SubProperty) {
  const format = schema.format as string | undefined;
  const pattern = schema.pattern as string | undefined;
  const examples = schema.examples as string[] | undefined;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700">
          {name}
          {format && (
            <span className="ml-1 text-[10px] text-gray-400">({format})</span>
          )}
        </label>
        <div className="mt-1 rounded-md bg-gray-50 p-3">
          <p className="mb-1 text-[10px] font-medium text-gray-400">
            Current value
          </p>
          <input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={
              pattern ? `Pattern: ${pattern}` : format ?? "string"
            }
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          {examples && examples.length > 0 && (
            <p className="mt-1.5 text-[10px] text-gray-400">
              Examples: {examples.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function NumberDisplay({ name, schema, value, onChange }: SubProperty) {
  const min = schema.minimum as number | undefined;
  const max = schema.maximum as number | undefined;

  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <label className="block text-xs font-medium text-gray-700">
          {name}
        </label>
        <div className="mt-1 rounded-md bg-gray-50 p-3">
          <p className="mb-1 text-[10px] font-medium text-gray-400">
            Current value
          </p>
          <input
            type="number"
            value={(value as string) ?? ""}
            onChange={(e) => onChange?.(e.target.value === "" ? undefined : Number(e.target.value))}
            placeholder={
              min !== undefined || max !== undefined
                ? `${min ?? "..."} – ${max ?? "..."}`
                : "number"
            }
            className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function BooleanDisplay({ name, value, onChange }: { name: string; value?: unknown; onChange?: (value: unknown) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <div className="mt-1 rounded-md bg-gray-50 p-3">
        <p className="mb-1 text-[10px] font-medium text-gray-400">
          Current value
        </p>
        <div className="flex gap-3">
          <label className="flex items-center gap-1 text-xs text-gray-700">
            <input
              type="radio"
              name={name}
              value="true"
              checked={value === true}
              onChange={() => onChange?.(true)}
              className="h-3 w-3 text-indigo-600"
            />
            true
          </label>
          <label className="flex items-center gap-1 text-xs text-gray-700">
            <input
              type="radio"
              name={name}
              value="false"
              checked={value === false}
              onChange={() => onChange?.(false)}
              className="h-3 w-3 text-indigo-600"
            />
            false
          </label>
        </div>
      </div>
    </div>
  );
}

function EnumDisplay({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: Record<string, unknown>;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
  const values = (schema.enum as string[]) ?? [];
  const descriptions = (schema.enumDescriptions as Record<string, string>) ?? {};

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <div className="mt-1 rounded-md bg-gray-50 p-3">
        <p className="mb-1 text-[10px] font-medium text-gray-400">
          Current value
        </p>
        <select
          value={(value as string) ?? ""}
          onChange={(e) => onChange?.(e.target.value || undefined)}
          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="">Select...</option>
          {values.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
        {values.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {values.map((v) => (
              <li key={v} className="text-[10px] text-gray-400">
                <span className="font-medium text-gray-500">{v}</span>
                {descriptions[v] && ` — ${descriptions[v]}`}
              </li>
            ))}
          </ul>
        )}
      </div>
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
  value,
  onChange,
}: {
  name: string;
  schema: Record<string, unknown>;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
  const properties = (schema.properties as Record<string, Record<string, unknown>>) ?? {};
  const entries = Object.entries(properties);
  const objValue = (value as Record<string, unknown>) ?? {};

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">
        {name}
        <span className="ml-1 text-[10px] text-gray-400">(object)</span>
      </label>
      {entries.length > 0 ? (
        <div className="mt-1 space-y-2 rounded border border-gray-200 bg-gray-50 p-3">
          {entries.map(([key, subSchema]) => (
            <TypeInput
              key={key}
              name={key}
              schema={subSchema}
              value={objValue[key]}
              onChange={(v) => onChange?.({ ...objValue, [key]: v })}
            />
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

function MoneyDisplay({
  name,
  value,
  onChange,
}: {
  name: string;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
  const moneyValue = (value as { amount?: number; currency?: string }) ?? {};

  return (
    <div>
      <label className="block text-xs font-medium text-gray-700">{name}</label>
      <div className="mt-1 rounded-md bg-gray-50 p-3">
        <p className="mb-1 text-[10px] font-medium text-gray-400">
          Current value
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Amount"
            value={moneyValue.amount ?? ""}
            onChange={(e) =>
              onChange?.({
                ...moneyValue,
                amount: e.target.value === "" ? undefined : Number(e.target.value),
              })
            }
            className="flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={moneyValue.currency ?? "GBP"}
            onChange={(e) =>
              onChange?.({ ...moneyValue, currency: e.target.value })
            }
            className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="GBP">GBP</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function TemporalRuleDisplay({
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
      <div className="mt-1 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-3">
        <p className="text-xs text-indigo-600">
          Temporal rule &mdash; <span className="text-[10px] text-indigo-400">{ref}</span>
        </p>
        <a
          href="#"
          className="mt-1 inline-block text-xs font-medium text-indigo-600 hover:underline"
        >
          Edit temporal rule &rarr;
        </a>
      </div>
    </div>
  );
}

function RefDisplay({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: Record<string, unknown>;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
  // Route to specialised displays for known $ref types
  if (isMoneyRef(schema)) return <MoneyDisplay name={name} value={value} onChange={onChange} />;
  if (isTemporalRuleRef(schema)) return <TemporalRuleDisplay name={name} schema={schema} />;

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
  value,
  onChange,
}: {
  name: string;
  schema: Record<string, unknown>;
  value?: unknown;
  onChange?: (value: unknown) => void;
}) {
  const type = resolveType(schema);

  switch (type) {
    case "string":
      return <StringDisplay name={name} schema={schema} value={value} onChange={onChange} />;
    case "number":
    case "integer":
      return <NumberDisplay name={name} schema={schema} value={value} onChange={onChange} />;
    case "boolean":
      return <BooleanDisplay name={name} value={value} onChange={onChange} />;
    case "enum":
      return <EnumDisplay name={name} schema={schema} value={value} onChange={onChange} />;
    case "array":
      return <ArrayDisplay name={name} schema={schema} />;
    case "object":
      return <ObjectDisplay name={name} schema={schema} value={value} onChange={onChange} />;
    case "$ref":
      return <RefDisplay name={name} schema={schema} value={value} onChange={onChange} />;
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
