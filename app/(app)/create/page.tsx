import { requireUser } from "@/lib/auth";
import { getOwnedPage, serializeOwnerPage, type OwnerPage } from "@/lib/page-helpers";
import { Wizard } from "@/components/wizard/Wizard";

type SearchParams = Promise<{ id?: string | string[] }>;

// /create renders the wizard, resuming the draft named by ?id= when there is one.
export default async function CreatePage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;

  let initialPage: OwnerPage | undefined;
  if (rawId) {
    try {
      const page = await getOwnedPage(rawId, user);
      initialPage = serializeOwnerPage(page.toObject());
    } catch {
      // A missing or foreign id simply starts a fresh draft instead of erroring.
      initialPage = undefined;
    }
  }

  return (
    <main className="min-h-screen bg-canvas">
      <Wizard mode="create" initialPage={initialPage} userId={String(user._id)} />
    </main>
  );
}
