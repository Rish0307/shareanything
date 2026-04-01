import { useParams, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { Download, Copy, Trash2, FileIcon, LinkIcon, FileText, ExternalLink, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { useGetShare, useDeleteShare, getGetShareQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ShareDetail() {
  const params = useParams();
  const id = params.id as string;
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: share, isLoading, isError } = useGetShare(id, {
    query: {
      enabled: !!id,
      queryKey: getGetShareQueryKey(id),
    }
  });

  const deleteShare = useDeleteShare();

  const handleDelete = () => {
    deleteShare.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Share deleted" });
        setLocation("/");
      },
      onError: () => {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    });
  };

  const copyText = () => {
    if (share?.content) {
      navigator.clipboard.writeText(share.content);
      toast({ title: "Copied to clipboard" });
    }
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  if (isError || !share) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 flex flex-col items-center text-center max-w-md">
          <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-6">
            <AlertTriangle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Share Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This share link may have expired, been deleted, or never existed in the first place.
          </p>
          <Button onClick={() => setLocation("/")} size="lg">Return Home</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge className="uppercase">{share.type}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Shared {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold truncate">
              {share.title || share.fileName || (share.type === 'url' ? share.content : 'Text Snippet')}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this share?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. The content will be permanently removed from the server.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card className="border-primary/20 shadow-lg shadow-primary/5">
          <CardHeader className="bg-accent/50 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              {share.type === 'file' && <FileIcon className="h-5 w-5 text-primary" />}
              {share.type === 'text' && <FileText className="h-5 w-5 text-primary" />}
              {share.type === 'url' && <LinkIcon className="h-5 w-5 text-primary" />}
              Content Details
            </CardTitle>
            <CardDescription className="flex items-center gap-4 mt-2">
              {share.fileSize && (
                <span className="flex items-center gap-1">
                  <HardDrive className="h-4 w-4" />
                  {formatSize(share.fileSize)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Download className="h-4 w-4" />
                {share.downloadCount} views/downloads
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {share.type === 'file' && (
              <div className="p-12 flex flex-col items-center justify-center text-center bg-card">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <FileIcon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-medium mb-2">{share.fileName}</h3>
                <p className="text-muted-foreground mb-8">{formatSize(share.fileSize)}</p>
                <Button size="lg" className="h-14 px-8 text-lg w-full max-w-sm" asChild>
                  <a href={`/api/shares/${share.id}/download`} download>
                    <Download className="mr-2 h-5 w-5" />
                    Download File
                  </a>
                </Button>
              </div>
            )}

            {share.type === 'text' && (
              <div className="relative">
                <Button 
                  variant="secondary" 
                  size="icon"
                  className="absolute top-4 right-4 z-10"
                  onClick={copyText}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <pre className="p-6 bg-zinc-950 text-zinc-50 overflow-x-auto min-h-[300px] font-mono text-sm leading-relaxed rounded-b-xl">
                  {share.content}
                </pre>
              </div>
            )}

            {share.type === 'url' && (
              <div className="p-12 flex flex-col items-center justify-center text-center bg-card">
                <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                  <LinkIcon className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-medium mb-8 max-w-2xl break-all">
                  {share.content}
                </h3>
                <Button size="lg" className="h-14 px-8 text-lg w-full max-w-sm" asChild>
                  <a href={share.content!} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-5 w-5" />
                    Visit Link
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
