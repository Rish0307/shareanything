import { useState } from "react";
import { useListShares, getListSharesQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { ShareZone } from "@/components/ShareZone";
import { ShareCard } from "@/components/ShareCard";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const [refreshKey, setRefreshKey] = useState(0);
  
  const { data: shares, isLoading } = useListShares(
    { limit: 12 },
    { 
      query: { 
        queryKey: getListSharesQueryKey({ limit: 12 }),
        refetchInterval: 5000 
      } 
    }
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 md:py-24">
        <div className="mb-16 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
            Share <span className="text-primary">Instantly</span>.
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Friction-free sharing for files, text, and URLs. Anonymous, ultra-fast, and secure.
          </p>
        </div>

        <ShareZone onSuccess={() => setRefreshKey(k => k + 1)} />

        <div className="mt-32">
          <h3 className="mb-6 text-xl font-bold tracking-tight">Recent Shares</h3>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : shares && shares.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shares.map((share) => (
                <ShareCard key={share.id} share={share} />
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed bg-card/50">
              <p className="text-muted-foreground">No recent shares. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
