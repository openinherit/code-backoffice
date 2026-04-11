import { redirect } from "next/navigation";

export default async function ExtensionDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const params = await props.params;
  redirect(`/extensions/${params.slug}/succession`);
}
