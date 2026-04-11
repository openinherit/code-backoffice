"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TypeInput } from "@/components/type-input";
import { saveDraft } from "@/actions/properties";

type PropertyEditorProps = {
  name: string;
  description: string | null;
  schemaType: string;
  schemaDefinition: Record<string, unknown>;
  status: string;
  groupName?: string;
  backHref?: string;
  extensionId: string;
  coverageArea: string;
  propertyId?: string;
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
  backHref,
  extensionId,
  coverageArea,
  propertyId,
}: PropertyEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  // Track edited values for each sub-property
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  const properties =
    (schemaDefinition.properties as Record<
      string,
      Record<string, unknown>
    >) ?? {};
  const required = (schemaDefinition.required as string[]) ?? [];
  const subProperties = Object.entries(properties);

  const handleValueChange = useCallback((key: string, value: unknown) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Build the updated schema_definition with edited values merged in
  const buildUpdatedSchema = useCallback((): Record<string, unknown> => {
    // If there are no sub-properties, return the original definition
    if (subProperties.length === 0) return schemaDefinition;

    // Clone the original definition
    const updated = { ...schemaDefinition };

    // Merge edited values into the properties — only set `default` for
    // fields the user actually touched, preserving the rest of the schema.
    const updatedProperties = { ...properties };
    for (const [key, value] of Object.entries(editedValues)) {
      if (value !== undefined && value !== "" && updatedProperties[key]) {
        updatedProperties[key] = {
          ...updatedProperties[key],
          default: value,
        };
      }
    }
    updated.properties = updatedProperties;

    return updated;
  }, [schemaDefinition, properties, subProperties.length, editedValues]);

  const handleSave = useCallback(() => {
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveDraft({
          extensionId,
          propertyId,
          coverageArea,
          name,
          description: description ?? undefined,
          schemaType,
          schemaDefinition: buildUpdatedSchema(),
        });
        if (backHref) {
          router.push(backHref);
        } else {
          router.push(`/extensions/${extensionId}/${coverageArea}`);
        }
      } catch (err: unknown) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save draft",
        );
      }
    });
  }, [
    extensionId,
    propertyId,
    coverageArea,
    name,
    description,
    schemaType,
    buildUpdatedSchema,
    backHref,
    router,
    startTransition,
  ]);

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
                    <TypeInput
                      name={key}
                      schema={subSchema}
                      value={editedValues[key]}
                      onChange={(v) => handleValueChange(key, v)}
                    />
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

      {/* Error */}
      {saveError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {saveError}
        </div>
      )}

      {/* Footer — Cancel + Save as draft */}
      <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
        {backHref ? (
          <Link
            href={backHref}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
          >
            Cancel
          </Link>
        ) : (
          <span />
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="rounded-md bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save as draft"}
        </button>
      </div>
    </div>
  );
}
