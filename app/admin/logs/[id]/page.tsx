import AdminApp from "../../ui";

export default async function AdminLogEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminApp initialView="editor" initialPostId={decodeURIComponent(id)} />;
}
