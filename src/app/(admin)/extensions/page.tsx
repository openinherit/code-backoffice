import { listExtensions } from "@/actions/extensions";
import { ExtensionsTable } from "@/components/extensions-table";

export default async function ExtensionsPage() {
  const extensions = await listExtensions();
  return <ExtensionsTable extensions={extensions} />;
}
