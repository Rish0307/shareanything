import { useState } from "react";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import {
  FileIcon,
  Link as LinkIcon,
  FileText,
  Download,
  Clock,
  User,
  Copy,
  Check,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { Share, useDeleteShare, getListSharesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ShareCardProps {
  share: Share;
}

export function ShareCard({ share }: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteShare = useDeleteShare();

  const getIcon = () => {
    switch (share.type) {
      case "file": return <FileIcon className="h-5 w-5" />;
      case "text": return <FileText className="h-5 w-5" />;
      case "url": return <LinkIcon className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    if (share.title) return share.title;
    if (share.type === "file") return share.fileName || "Unnamed File";
    if (share.type === "url") return share.content || "URL";
    return "Text Snippet";
  };

  const getPreview = () => {
    if (share.type === "text" && share.content) {
      return share.content.slice(0, 120) + (share.content.length > 120 ? "..." : "");
    }
    if (share.type === "url" && share.content) {
      return share.content;
    }
    return null;
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 B";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!share.content) return;
    navigator.clipboard.writeText(share.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteShare.mutate(
      { id: share.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSharesQueryKey({ limit: 30 }) });
          toast({ title: "Deleted", description: "Share removed from the feed." });
        },
        onError: () => {
          toast({ title: "Delete failed", variant: "destructive" });
        },
      }
    );
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `/api/shares/${share.id}/download`;
    a.download = share.fileName ?? "download";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!share.content) return;
    window.open(share.content, "_blank", "noopener,noreferrer");
  };

  const preview = getPreview();

  return (
    <Link href={`/s/${share.id}`} data-testid={`card-share-${share.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5 h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Header row */}
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                "bg-accent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
              )}
            >
              {getIcon()}
            </div>

            <div className="flex flex-1 items-center justify-between gap-2 overflow-hidden">
              <h4 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                {getTitle()}
              </h4>
              <Badge variant="secondary" className="shrink-0 uppercase text-[10px]">
                {share.type}
              </Badge>
            </div>
          </div>

          {/* Content preview */}
          {preview && (
            <p className="text-xs text-muted-foreground line-clamp-2 font-mono bg-muted/50 px-3 py-2 rounded-md break-all leading-relaxed">
              {preview}
            </p>
          )}

          {/* File size for files without preview */}
          {share.type === "file" && (
            <div className="text-xs text-muted-foreground bg-muted/30 px-3 py-2 rounded-md flex items-center justify-between">
              <span>{share.fileName}</span>
              {share.fileSize && <span className="font-medium">{formatSize(share.fileSize)}</span>}
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/30">
            <div className="flex items-center gap-1 text-xs text-muted-foreground/80">
              <User className="h-3 w-3" />
              <span data-testid={`text-author-${share.id}`} className="font-medium">{share.authorName}</span>
              <span className="mx-1">·</span>
              <Clock className="h-3 w-3" />
              <span>{formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}</span>
            </div>

            <div className="flex items-center gap-1">
              {share.type === "text" && (
                <button
                  data-testid={`button-copy-${share.id}`}
                  onClick={handleCopy}
                  title="Copy text"
                  className={cn(
                    "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
                    copied
                      ? "bg-green-500/15 text-green-600"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              )}

              {share.type === "file" && (
                <button
                  data-testid={`button-download-${share.id}`}
                  onClick={handleDownload}
                  title="Download file"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <Download className="h-3 w-3" />
                  Download
                </button>
              )}

              {share.type === "url" && (
                <button
                  data-testid={`button-open-${share.id}`}
                  onClick={handleOpenUrl}
                  title="Open URL"
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </button>
              )}

              <button
                data-testid={`button-delete-${share.id}`}
                onClick={handleDelete}
                title={confirmDelete ? "Click again to confirm" : "Delete"}
                disabled={deleteShare.isPending}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-all",
                  confirmDelete
                    ? "bg-red-500/15 text-red-600 hover:bg-red-500/25"
                    : "bg-muted text-muted-foreground hover:bg-red-500/15 hover:text-red-600"
                )}
              >
                <Trash2 className="h-3 w-3" />
                {confirmDelete ? "Sure?" : "Delete"}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
