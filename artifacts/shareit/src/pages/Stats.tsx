import { useGetStats, getGetStatsQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileIcon, LinkIcon, FileText, Download, Activity, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Stats() {
  const { data: stats, isLoading } = useGetStats({
    query: {
      queryKey: getGetStatsQueryKey(),
      refetchInterval: 10000,
    }
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-12 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 text-primary">
            <Activity className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Platform Stats</h1>
            <p className="text-muted-foreground mt-1 text-lg">Real-time metrics across ShareIt.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-card border-primary/20 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Shares</CardTitle>
                <Share2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalShares.toLocaleString()}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Downloads</CardTitle>
                <Download className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalDownloads.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Files</CardTitle>
                <FileIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalFiles.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Text Snippets</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalTextShares.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">URLs</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">{stats.totalUrlShares.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
