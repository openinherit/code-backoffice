"use client";

import { useCallback } from "react";

export type EnumValue = { value: string; description: string };

export type EnumEditorProps = {
  values: EnumValue[];
  onChange: (values: EnumValue[]) => void;
  readonlyValues?: string[];
};

export function EnumEditor({
  values,
  onChange,
  readonlyValues = [],
}: EnumEditorProps) {
  const addValue = useCallback(() => {
    onChange([...values, { value: "", description: "" }]);
  }, [values, onChange]);

  const removeValue = useCallback(
    (index: number) => {
      onChange(values.filter((_, i) => i !== index));
    },
    [values, onChange],
  );

  const updateValue = useCallback(
    (index: number, field: keyof EnumValue, newVal: string) => {
      const updated = values.map((v, i) =>
        i === index ? { ...v, [field]: newVal } : v,
      );
      onChange(updated);
    },
    [values, onChange],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return;
      const updated = [...values];
      [updated[index - 1], updated[index]] = [
        updated[index],
        updated[index - 1],
      ];
      onChange(updated);
    },
    [values, onChange],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index === values.length - 1) return;
      const updated = [...values];
      [updated[index], updated[index + 1]] = [
        updated[index + 1],
        updated[index],
      ];
      onChange(updated);
    },
    [values, onChange],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2">
        <p className="text-xs text-blue-700">
          <strong>Naming convention:</strong> Use <code className="font-mono">snake_case</code>{" "}
          for enum values (e.g. <code className="font-mono">prior_rights</code>,{" "}
          <code className="font-mono">legal_share</code>). Keep values short, descriptive,
          and lowercase.
        </p>
      </div>

      {values.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-400">
          No enum values defined yet
        </div>
      ) : (
        <div className="space-y-2">
          {values.map((val, index) => {
            const isReadonly = readonlyValues.includes(val.value);
            return (
              <div
                key={index}
                className="flex items-start gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
              >
                {/* Reorder buttons */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Move ${val.value || "value"} up`}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={index === values.length - 1}
                    className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-30 disabled:hover:bg-transparent"
                    aria-label={`Move ${val.value || "value"} down`}
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Value input */}
                <div className="flex-1">
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </label>
                  <input
                    type="text"
                    value={val.value}
                    onChange={(e) => updateValue(index, "value", e.target.value)}
                    placeholder="snake_case_value"
                    disabled={isReadonly}
                    className="mt-0.5 w-full rounded border border-gray-200 bg-white px-2 py-1 font-mono text-xs text-gray-900 placeholder:text-gray-300 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                  />
                </div>

                {/* Description input */}
                <div className="flex-[2]">
                  <label className="block text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </label>
                  <input
                    type="text"
                    value={val.description}
                    onChange={(e) =>
                      updateValue(index, "description", e.target.value)
                    }
                    placeholder="Plain-English description"
                    className="mt-0.5 w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-900 placeholder:text-gray-300 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeValue(index)}
                  disabled={isReadonly}
                  className="mt-4 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  aria-label={`Remove ${val.value || "value"}`}
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
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={addValue}
        className="rounded-md border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
      >
        + Add value
      </button>
    </div>
  );
}
