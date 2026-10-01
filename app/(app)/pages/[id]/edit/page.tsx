import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getOwnedPage, serializeOwnerPage } from "@/lib/page-helpers";
import { Wizard } from "@/components/wizard/Wizard";

type Params = Promise<{ id: string }>;

// /pages/[id]/edit always starts from the stored page and begins at step 1.
export default async function EditPage({ params }: { params: Params }) {
  const user = await requireUser();
  const { id } = await params;

  let page;
  try {
    page = await getOwnedPage(id, user);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-canvas">
      <Wizard
        mode="edit"
        initialPage={serializeOwnerPage(page.toObject())}
        userId={String(user._id)}
      />
    </main>
  );
}
