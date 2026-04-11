"use client";

import { useState, useCallback, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EnumEditor, type EnumValue } from "@/components/enum-editor";
import { DefsBrowser } from "@/components/defs-browser";
import { saveDraft } from "@/actions/properties";

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

type PropertyGroup = {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
};

type SubProperty = {
  name: string;
  type: string;
  description: string;
  required: boolean;
};

const SCHEMA_TYPES = [
  {
    value: "object",
    label: "Object",
    description: "A structured type with named sub-properties",
  },
  {
    value: "string",
    label: "String",
    description: "Free text, dates, or formatted values",
  },
  {
    value: "enum",
    label: "Enum",
    description: "A fixed set of allowed values",
  },
  {
    value: "boolean",
    label: "Boolean",
    description: "True or false — yes/no flags",
  },
  {
    value: "number",
    label: "Number",
    description: "Numeric values — amounts, percentages, counts",
  },
  {
    value: "array",
    label: "Array",
    description: "A list of items of the same type",
  },
  {
    value: "$ref",
    label: "$ref",
    description: "Reference a shared definition ($defs)",
  },
] as const;

type SchemaType = (typeof SCHEMA_TYPES)[number]["value"];

// ----------------------------------------------------------------
// Schema builder — generates JSON Schema from form state
// ----------------------------------------------------------------

function buildSchema(opts: {
  type: SchemaType;
  description: string;
  subProperties: SubProperty[];
  enumValues: EnumValue[];
  selectedRef: string | null;
  stringMaxLength: string;
  stringFormat: string;
  numberMin: string;
  numberMax: string;
  arrayItemsType: string;
}): Record<string, unknown> {
  const base: Record<string, unknown> = {};
  if (opts.description) base.description = opts.description;

  switch (opts.type) {
    case "object": {
      base.type = "object";
      const properties: Record<string, Record<string, unknown>> = {};
      const required: string[] = [];
      for (const sub of opts.subProperties) {
        if (!sub.name.trim()) continue;
        const prop: Record<string, unknown> = { type: sub.type };
        if (sub.description) prop.description = sub.description;
        properties[sub.name] = prop;
        if (sub.required) required.push(sub.name);
      }
      if (Object.keys(properties).length > 0) base.properties = properties;
      if (required.length > 0) base.required = required;
      base.additionalProperties = false;
      break;
    }
    case "string": {
      base.type = "string";
      if (opts.stringMaxLength) {
        const parsed = parseInt(opts.stringMaxLength, 10);
        if (!isNaN(parsed) && parsed > 0) base.maxLength = parsed;
      }
      if (opts.stringFormat) base.format = opts.stringFormat;
      break;
    }
    case "enum": {
      base.type = "string";
      const vals = opts.enumValues.filter((v) => v.value.trim());
      base.enum = vals.map((v) => v.value);
      if (vals.some((v) => v.description)) {
        base["x-enum-descriptions"] = vals.reduce(
          (acc, v) => {
            if (v.description) acc[v.value] = v.description;
            return acc;
          },
          {} as Record<string, string>,
        );
      }
      break;
    }
    case "boolean": {
      base.type = "boolean";
      break;
    }
    case "number": {
      base.type = "number";
      if (opts.numberMin) {
        const parsed = parseFloat(opts.numberMin);
        if (!isNaN(parsed)) base.minimum = parsed;
      }
      if (opts.numberMax) {
        const parsed = parseFloat(opts.numberMax);
        if (!isNaN(parsed)) base.maximum = parsed;
      }
      break;
    }
    case "array": {
      base.type = "array";
      if (opts.arrayItemsType) {
        base.items = { type: opts.arrayItemsType };
      }
      break;
    }
    case "$ref": {
      if (opts.selectedRef) {
        base.$ref = `#/$defs/${opts.selectedRef}`;
      }
      break;
    }
  }

  return base;
}

// ----------------------------------------------------------------
// Component
// ----------------------------------------------------------------

export type AddPropertyWizardProps = {
  extensionSlug: string;
  coverageArea: string;
  groups: PropertyGroup[];
};

export function AddPropertyWizard({
  extensionSlug,
  coverageArea,
  groups,
}: AddPropertyWizardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Step tracking
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [schemaType, setSchemaType] = useState<SchemaType>("object");

  // Step 2 — Object sub-properties
  const [subProperties, setSubProperties] = useState<SubProperty[]>([]);

  // Step 2 — Enum values
  const [enumValues, setEnumValues] = useState<EnumValue[]>([]);

  // Step 2 — $ref selection
  const [selectedRef, setSelectedRef] = useState<string | null>(null);

  // Step 2 — String constraints
  const [stringMaxLength, setStringMaxLength] = useState("");
  const [stringFormat, setStringFormat] = useState("");

  // Step 2 — Number constraints
  const [numberMin, setNumberMin] = useState("");
  const [numberMax, setNumberMax] = useState("");

  // Step 2 — Array items type
  const [arrayItemsType, setArrayItemsType] = useState("string");

  // Error state
  const [saveError, setSaveError] = useState<string | null>(null);

  // Validation
  const step1Valid = name.trim().length > 0;

  const addSubProperty = useCallback(() => {
    setSubProperties((prev) => [
      ...prev,
      { name: "", type: "string", description: "", required: false },
    ]);
  }, []);

  const updateSubProperty = useCallback(
    (index: number, field: keyof SubProperty, value: string | boolean) => {
      setSubProperties((prev) =>
        prev.map((sp, i) => (i === index ? { ...sp, [field]: value } : sp)),
      );
    },
    [],
  );

  const removeSubProperty = useCallback((index: number) => {
    setSubProperties((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Build the live JSON Schema preview
  const schemaPreview = useMemo(
    () =>
      buildSchema({
        type: schemaType,
        description,
        subProperties,
        enumValues,
        selectedRef,
        stringMaxLength,
        stringFormat,
        numberMin,
        numberMax,
        arrayItemsType,
      }),
    [
      schemaType,
      description,
      subProperties,
      enumValues,
      selectedRef,
      stringMaxLength,
      stringFormat,
      numberMin,
      numberMax,
      arrayItemsType,
    ],
  );

  // Save handler
  const handleSave = useCallback(() => {
    setSaveError(null);
    startTransition(async () => {
      try {
        await saveDraft({
          extensionId: extensionSlug,
          coverageArea,
          name: name.trim(),
          description: description.trim() || undefined,
          schemaType: schemaType === "enum" ? "string" : schemaType === "$ref" ? "object" : schemaType,
          schemaDefinition: schemaPreview,
        });
        router.push(`/extensions/${extensionSlug}/${coverageArea}`);
      } catch (err: unknown) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save draft",
        );
      }
    });
  }, [
    extensionSlug,
    coverageArea,
    name,
    description,
    schemaType,
    schemaPreview,
    router,
    startTransition,
  ]);

  const coverageLabel =
    coverageArea === "succession" ? "Succession Rules" : "Tax Treatment";

  return (
    <div className="mx-auto max-w-3xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-xs text-gray-500">
        <button
          type="button"
          onClick={() => router.push(`/extensions/${extensionSlug}/${coverageArea}`)}
          className="text-indigo-600 hover:underline"
        >
          {coverageLabel}
        </button>
        <span>/</span>
        <span className="font-medium text-gray-900">New property</span>
      </nav>

      <h2 className="mt-4 text-lg font-semibold text-gray-900">
        Add property
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Define a new schema property for {coverageLabel.toLowerCase()}.
      </p>

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-2">
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step === 1
              ? "bg-indigo-600 text-white"
              : "bg-indigo-100 text-indigo-600"
          }`}
        >
          1
        </div>
        <div className="h-px w-8 bg-gray-300" />
        <div
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
            step === 2
              ? "bg-indigo-600 text-white"
              : "bg-gray-200 text-gray-500"
          }`}
        >
          2
        </div>
        <span className="ml-2 text-xs text-gray-500">
          {step === 1 ? "Name & Type" : "Configure"}
        </span>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="mt-6 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="prop-name"
              className="block text-sm font-medium text-gray-700"
            >
              Property name
            </label>
            <input
              id="prop-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. legalRights"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-400">
              Use <strong>camelCase</strong> — this becomes the JSON Schema
              property key.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="prop-desc"
              className="block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="prop-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What does this property represent?"
              className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Group */}
          {groups.length > 0 && (
            <div>
              <label
                htmlFor="prop-group"
                className="block text-sm font-medium text-gray-700"
              >
                Property group
              </label>
              <select
                id="prop-group"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Type selection */}
          <div>
            <span className="block text-sm font-medium text-gray-700">
              Schema type
            </span>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SCHEMA_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setSchemaType(t.value)}
                  className={`rounded-lg border-2 px-3 py-2 text-left transition-colors ${
                    schemaType === t.value
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <span className="block text-sm font-semibold text-gray-900">
                    {t.label}
                  </span>
                  <span className="block text-[11px] leading-tight text-gray-500">
                    {t.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Next button */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600"
            >
              Next: Configure &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="mt-6 space-y-6">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStep(1)}
            className="text-xs text-indigo-600 hover:underline"
          >
            &larr; Back to Name & Type
          </button>

          {/* Type-specific configuration */}
          {schemaType === "object" && (
            <ObjectConfigurator
              subProperties={subProperties}
              onAdd={addSubProperty}
              onUpdate={updateSubProperty}
              onRemove={removeSubProperty}
            />
          )}

          {schemaType === "enum" && (
            <EnumEditor values={enumValues} onChange={setEnumValues} />
          )}

          {schemaType === "$ref" && (
            <DefsBrowser selected={selectedRef} onSelect={setSelectedRef} />
          )}

          {schemaType === "string" && (
            <StringConfigurator
              maxLength={stringMaxLength}
              onMaxLengthChange={setStringMaxLength}
              format={stringFormat}
              onFormatChange={setStringFormat}
            />
          )}

          {schemaType === "number" && (
            <NumberConfigurator
              min={numberMin}
              onMinChange={setNumberMin}
              max={numberMax}
              onMaxChange={setNumberMax}
            />
          )}

          {schemaType === "boolean" && (
            <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              Boolean properties have no additional configuration. The value
              will be <code className="font-mono">true</code> or{" "}
              <code className="font-mono">false</code>.
            </div>
          )}

          {schemaType === "array" && (
            <ArrayConfigurator
              itemsType={arrayItemsType}
              onItemsTypeChange={setArrayItemsType}
            />
          )}

          {/* Schema preview */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              JSON Schema preview
            </h4>
            <pre className="mt-2 overflow-x-auto rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
              {JSON.stringify(schemaPreview, null, 2)}
            </pre>
          </div>

          {/* Error */}
          {saveError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {saveError}
            </div>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending || !step1Valid}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save as draft"}
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(
                  `/extensions/${extensionSlug}/${coverageArea}`,
                )
              }
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------
// Sub-components for Step 2 configurators
// ----------------------------------------------------------------

function ObjectConfigurator({
  subProperties,
  onAdd,
  onUpdate,
  onRemove,
}: {
  subProperties: SubProperty[];
  onAdd: () => void;
  onUpdate: (index: number, field: keyof SubProperty, value: string | boolean) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Sub-properties
      </h4>

      {subProperties.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
          No sub-properties yet. Add one below.
        </div>
      ) : (
        <div className="space-y-2">
          {subProperties.map((sp, index) => (
            <div
              key={index}
              className="flex items-start gap-2 rounded-md border border-gray-200 bg-white p-3"
            >
              {/* Name */}
              <div className="flex-1">
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </label>
                <input
                  type="text"
                  value={sp.name}
                  onChange={(e) => onUpdate(index, "name", e.target.value)}
                  placeholder="camelCase"
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 font-mono text-xs focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                />
              </div>

              {/* Type */}
              <div className="w-24">
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={sp.type}
                  onChange={(e) => onUpdate(index, "type", e.target.value)}
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="object">object</option>
                  <option value="array">array</option>
                </select>
              </div>

              {/* Description */}
              <div className="flex-[2]">
                <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </label>
                <input
                  type="text"
                  value={sp.description}
                  onChange={(e) =>
                    onUpdate(index, "description", e.target.value)
                  }
                  placeholder="What this field represents"
                  className="mt-0.5 w-full rounded border border-gray-200 px-2 py-1 text-xs focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                />
              </div>

              {/* Required checkbox */}
              <div className="pt-4">
                <label className="flex items-center gap-1 text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={sp.required}
                    onChange={(e) =>
                      onUpdate(index, "required", e.target.checked)
                    }
                    className="h-3.5 w-3.5 rounded border-gray-300 text-indigo-600"
                  />
                  Req
                </label>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="mt-4 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
                aria-label="Remove sub-property"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
      >
        + Add sub-property
      </button>
    </div>
  );
}

function StringConfigurator({
  maxLength,
  onMaxLengthChange,
  format,
  onFormatChange,
}: {
  maxLength: string;
  onMaxLengthChange: (v: string) => void;
  format: string;
  onFormatChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        String constraints
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="str-max"
            className="block text-xs font-medium text-gray-700"
          >
            Max length
          </label>
          <input
            id="str-max"
            type="number"
            min="1"
            value={maxLength}
            onChange={(e) => onMaxLengthChange(e.target.value)}
            placeholder="No limit"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="str-format"
            className="block text-xs font-medium text-gray-700"
          >
            Format
          </label>
          <select
            id="str-format"
            value={format}
            onChange={(e) => onFormatChange(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="">None</option>
            <option value="date">date</option>
            <option value="date-time">date-time</option>
            <option value="email">email</option>
            <option value="uri">uri</option>
            <option value="uuid">uuid</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function NumberConfigurator({
  min,
  onMinChange,
  max,
  onMaxChange,
}: {
  min: string;
  onMinChange: (v: string) => void;
  max: string;
  onMaxChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Number constraints
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="num-min"
            className="block text-xs font-medium text-gray-700"
          >
            Minimum
          </label>
          <input
            id="num-min"
            type="number"
            value={min}
            onChange={(e) => onMinChange(e.target.value)}
            placeholder="No minimum"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="num-max"
            className="block text-xs font-medium text-gray-700"
          >
            Maximum
          </label>
          <input
            id="num-max"
            type="number"
            value={max}
            onChange={(e) => onMaxChange(e.target.value)}
            placeholder="No maximum"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function ArrayConfigurator({
  itemsType,
  onItemsTypeChange,
}: {
  itemsType: string;
  onItemsTypeChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
        Array configuration
      </h4>
      <div>
        <label
          htmlFor="arr-type"
          className="block text-xs font-medium text-gray-700"
        >
          Item type
        </label>
        <select
          id="arr-type"
          value={itemsType}
          onChange={(e) => onItemsTypeChange(e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
        >
          <option value="string">string</option>
          <option value="number">number</option>
          <option value="boolean">boolean</option>
          <option value="object">object</option>
        </select>
      </div>
    </div>
  );
}
