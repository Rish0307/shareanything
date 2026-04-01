import { useListShares, getListSharesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ShareZone } from "@/components/ShareZone";
import { ShareCard } from "@/components/ShareCard";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const queryClient = useQueryClient();
  const sharesQueryKey = getListSharesQueryKey({ limit: 30 });

  const { data: shares, isLoading } = useListShares(
    { limit: 30 },
    {
      query: {
        queryKey: sharesQueryKey,
        refetchInterval: 4000,
      },
    }
  );

  const handleShareSuccess = () => {
    queryClient.invalidateQueries({ queryKey: sharesQueryKey });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight sm:text-5xl text-foreground">
            Share <span className="text-primary">Instantly</span>.
          </h1>
        </div>

        <ShareZone onSuccess={handleShareSuccess} />

        <div className="mt-12">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold tracking-tight">
              Public Feed
              {shares && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {shares.length} {shares.length === 1 ? "share" : "shares"}
                </span>
              )}
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              Live
            </span>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : shares && shares.length > 0 ? (
            <div
              className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              data-testid="list-shares"
            >
              {shares.map((share) => (
                <ShareCard key={share.id} share={share} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-card/50">
              <p className="text-muted-foreground">
                Nothing shared yet. Be the first!
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
