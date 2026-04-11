import { TypeInput } from "@/components/type-input";

type PropertyEditorProps = {
  name: string;
  description: string | null;
  schemaType: string;
  schemaDefinition: Record<string, unknown>;
  status: string;
  groupName?: string;
};

const statusBadge: Record<string, string> = {
  published: "bg-green-100 text-green-700",
  draft: "bg-amber-100 text-amber-700",
  partner_draft: "bg-amber-100 text-amber-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  publishing: "bg-indigo-100 text-indigo-700",
};

const typeBadge: Record<string, string> = {
  object: "bg-gray-100 text-gray-600",
  string: "bg-sky-100 text-sky-700",
  number: "bg-emerald-100 text-emerald-700",
  boolean: "bg-orange-100 text-orange-700",
  array: "bg-purple-100 text-purple-700",
  enum: "bg-rose-100 text-rose-700",
};

export function PropertyEditor({
  name,
  description,
  schemaType,
  schemaDefinition,
  status,
  groupName,
}: PropertyEditorProps) {
  const properties =
    (schemaDefinition.properties as Record<
      string,
      Record<string, unknown>
    >) ?? {};
  const required = (schemaDefinition.required as string[]) ?? [];
  const subProperties = Object.entries(properties);

  return (
    <div>
      {/* Property header */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="font-mono text-sm font-bold text-gray-900">
              {name}
            </h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                statusBadge[status] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {status}
            </span>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                typeBadge[schemaType] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {schemaType}
            </span>
          </div>
          {groupName && (
            <p className="mt-0.5 text-[10px] text-gray-400 uppercase tracking-wider">
              {groupName}
            </p>
          )}
          {description && (
            <p className="mt-1 text-xs text-gray-500">{description}</p>
          )}
        </div>

        {/* Sub-properties */}
        <div className="p-4">
          {subProperties.length === 0 ? (
            <div className="rounded border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
              No sub-properties defined in schema
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                Sub-properties ({subProperties.length})
              </p>
              {subProperties.map(([key, subSchema]) => (
                <div
                  key={key}
                  className="rounded border border-gray-100 bg-gray-50/50 p-3"
                >
                  <div className="flex items-center gap-1.5">
                    <TypeInput name={key} schema={subSchema} />
                    {required.includes(key) && (
                      <span className="mt-5 rounded bg-red-100 px-1.5 py-0.5 text-[9px] font-medium text-red-600">
                        required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Raw JSON schema (collapsible) */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-700">
          View raw JSON Schema
        </summary>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
          {JSON.stringify(schemaDefinition, null, 2)}
        </pre>
      </details>
    </div>
  );
}
