import { listExtensions } from "@/actions/extensions";
import { FilteredExtensionsTable } from "@/components/extensions-filters";

export default async function ExtensionsPage() {
  const extensions = await listExtensions();
  return <FilteredExtensionsTable extensions={extensions} />;
}
