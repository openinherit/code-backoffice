import { getExtension } from "@/actions/extensions";
import { notFound } from "next/navigation";

export default async function MetadataPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  let extension;
  try {
    extension = await getExtension(params.slug);
  } catch {
    notFound();
  }

  const metadataEntries = Object.entries(extension.metadata ?? {});

  return (
    <div>
      <div className="rounded-lg border border-gray-200">
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <h3 className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
            Extension metadata
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Slug
            </span>
            <span className="font-mono text-xs text-gray-900">
              {extension.slug}
            </span>
          </div>
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Legal tradition
            </span>
            <span className="text-xs text-gray-900">
              {extension.legal_tradition ?? "—"}
            </span>
          </div>
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Schema path
            </span>
            <span className="font-mono text-xs text-gray-900">
              {extension.schema_path ?? "—"}
            </span>
          </div>
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Key features
            </span>
            <span className="text-xs text-gray-900">
              {extension.key_features ?? "—"}
            </span>
          </div>
          {metadataEntries.map(([key, value]) => (
            <div key={key} className="flex px-4 py-2.5">
              <span className="w-40 text-xs font-medium text-gray-500">
                {key}
              </span>
              <span className="text-xs text-gray-900">
                {typeof value === "string"
                  ? value
                  : JSON.stringify(value, null, 2)}
              </span>
            </div>
          ))}
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Created
            </span>
            <span className="text-xs text-gray-900">
              {new Date(extension.created_at).toLocaleDateString("en-GB")}
            </span>
          </div>
          <div className="flex px-4 py-2.5">
            <span className="w-40 text-xs font-medium text-gray-500">
              Updated
            </span>
            <span className="text-xs text-gray-900">
              {new Date(extension.updated_at).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
