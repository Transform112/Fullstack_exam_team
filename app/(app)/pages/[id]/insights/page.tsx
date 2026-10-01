import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getOwnedPage, serializeOwnerPage } from "@/lib/page-helpers";
import { formatDate } from "@/lib/utils";
import type { PageLean } from "@/models/Page";
import { pageInsights } from "@/services/analytics";
import { listAllWishes } from "@/services/wishes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/app/ErrorState";
import { ShareKit } from "@/components/app/ShareKit";
import { ViewsChart } from "@/components/app/ViewsChart";
import { WishList } from "@/components/app/WishList";

const WISH_PAGE_SIZE = 10;

export const dynamic = "force-dynamic";

export const metadata = { title: "Insights - Wishly" };

// Small presentational stat card for the three insight numbers.
function StatCard({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-muted">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold text-ink">{value.toLocaleString()}</p>
        <p className="text-xs text-muted">{hint}</p>
      </CardContent>
    </Card>
  );
}

// Streaming placeholder for the chart and wish list while their data loads.
function InsightsFallback() {
  return (
    <div className="flex flex-col gap-6" aria-hidden>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Server sub-tree: reads EP-25 and EP-23 through the services (server code never calls
// its own API over HTTP) and streams the chart plus the wish list into the page shell.
async function InsightsData({ page }: { page: PageLean }) {
  const [insights, wishes] = await Promise.all([
    pageInsights(page).catch(() => null),
    listAllWishes(String(page._id), 1, WISH_PAGE_SIZE, 0).catch(() => null),
  ]);

  if (!insights || !wishes) {
    return <ErrorState message="We could not load the insights for this page. Please try again." />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Views · last 30 days</CardTitle>
          <CardDescription>
            {insights.totals.views} total views · {insights.totals.uniqueViews} unique visitors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ViewsChart data={insights.viewsByDay} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wishes</CardTitle>
          <CardDescription>Everything friends have written on this page.</CardDescription>
        </CardHeader>
        <CardContent>
          <WishList
            pageId={String(page._id)}
            initialWishes={wishes.rows}
            initialTotal={wishes.total}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// Insights page (docs/03 step P4-10). The owner or an admin may open it.
export default async function InsightsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const page = await getOwnedPage(id, user, true).catch(() => null);
  if (!page) notFound();

  const plain = page.toObject() as PageLean;
  const owner = serializeOwnerPage(plain);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  const shareUrl = owner.slug ? `${appUrl}/w/${owner.slug}` : null;
  const recipient = owner.recipient.name || "Untitled surprise";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button asChild variant="ghost" className="-ml-3 mb-1">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to dashboard
          </Link>
        </Button>
        <h1 className="font-heading text-2xl font-semibold text-ink sm:text-3xl">Insights</h1>
        <p className="text-sm text-muted">
          {recipient} · {owner.status === "PUBLISHED" ? "Live" : owner.status} · created{" "}
          {formatDate(owner.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total views" value={owner.stats.views} hint="Every counted visit" />
        <StatCard label="Unique visitors" value={owner.stats.uniqueViews} hint="One per browser" />
        <StatCard label="Wishes" value={owner.stats.wishes} hint="Wishes left by friends" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Share your page</CardTitle>
          <CardDescription>
            {shareUrl
              ? "Copy the link, download the QR code or post it to social media."
              : "Publish this page to get a share link and a QR code."}
          </CardDescription>
        </CardHeader>
        {shareUrl ? (
          <CardContent>
            <ShareKit
              url={shareUrl}
              recipientName={owner.recipient.name || "your friend"}
              slug={owner.slug ?? ""}
            />
          </CardContent>
        ) : null}
      </Card>

      <Suspense fallback={<InsightsFallback />}>
        <InsightsData page={plain} />
      </Suspense>
    </div>
  );
}
