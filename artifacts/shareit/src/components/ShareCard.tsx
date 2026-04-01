import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { FileIcon, Link as LinkIcon, FileText, Download, Clock } from "lucide-react";
import { Share } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShareCardProps {
  share: Share;
}

export function ShareCard({ share }: ShareCardProps) {
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

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  return (
    <Link href={`/s/${share.id}`}>
      <Card className="group cursor-pointer overflow-hidden border-border/50 bg-card transition-all hover:border-primary/50 hover:shadow-md hover:shadow-primary/5">
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
            "bg-accent text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            {getIcon()}
          </div>
          
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <h4 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                {getTitle()}
              </h4>
              <Badge variant="secondary" className="shrink-0 uppercase text-xs">
                {share.type}
              </Badge>
            </div>
            
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(share.createdAt), { addSuffix: true })}
              </div>
              
              {share.type === "file" && share.fileSize && (
                <div className="flex items-center gap-1">
                  <FileIcon className="h-3 w-3" />
                  {formatSize(share.fileSize)}
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Download className="h-3 w-3" />
                {share.downloadCount}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
