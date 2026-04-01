import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Send, X } from "lucide-react";
import { useCreateShare } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuthorName } from "@/hooks/use-random-name";

interface ShareZoneProps {
  onSuccess: () => void;
}

function isUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function ShareZone({ onSuccess }: ShareZoneProps) {
  const [content, setContent] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const { toast } = useToast();
  const createShare = useCreateShare();
  const authorName = useAuthorName();

  const handleShareSuccess = (_id: string) => {
    onSuccess();
    setContent("");
    setPendingFile(null);
    setUploadProgress(0);
    toast({
      title: "Shared!",
      description: "Your share is now visible in the public feed.",
    });
  };

  const uploadFile = useCallback(
    (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("authorName", authorName);

      setIsUploading(true);
      setUploadProgress(0);

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        setIsUploading(false);
        if (xhr.status === 201) {
          try {
            const data = JSON.parse(xhr.responseText);
            setUploadProgress(100);
            setTimeout(() => handleShareSuccess(data.id), 200);
          } catch {
            toast({ title: "Upload failed", description: "Invalid response.", variant: "destructive" });
            setUploadProgress(0);
          }
        } else {
          toast({ title: "Upload failed", description: "Please try again.", variant: "destructive" });
          setUploadProgress(0);
        }
      };

      xhr.onerror = () => {
        setIsUploading(false);
        setUploadProgress(0);
        toast({ title: "Upload failed", description: "Network error.", variant: "destructive" });
      };

      xhr.open("POST", "/api/shares/upload");
      xhr.send(formData);
    },
    [toast, authorName]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setPendingFile(acceptedFiles[0]);
      setContent("");
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const handleShare = () => {
    if (pendingFile) {
      uploadFile(pendingFile);
      return;
    }
    const trimmed = content.trim();
    if (!trimmed) return;

    const type = isUrl(trimmed) ? "url" : "text";
    createShare.mutate(
      { data: { type, content: trimmed, authorName } },
      {
        onSuccess: (data) => handleShareSuccess(data.id),
        onError: () => {
          toast({ title: "Failed to share", variant: "destructive" });
        },
      }
    );
  };

  const canShare = !!pendingFile || !!content.trim();
  const isPending = isUploading || createShare.isPending;

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50"
        )}
      >
        <input {...getInputProps()} data-testid="input-file-upload" />

        {isDragActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/5 backdrop-blur-sm">
            <UploadCloud className="h-14 w-14 text-primary mb-3" />
            <p className="text-xl font-bold text-primary">Drop to upload</p>
          </div>
        )}

        <div className="p-6">
          {pendingFile ? (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex items-center gap-3 rounded-xl border bg-background/60 px-5 py-4 w-full max-w-md">
                <UploadCloud className="h-6 w-6 text-primary shrink-0" />
                <span className="flex-1 truncate font-medium">{pendingFile.name}</span>
                <button
                  onClick={() => { setPendingFile(null); setUploadProgress(0); }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {(isUploading || uploadProgress > 0) && (
                <div className="w-full max-w-md">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {isUploading ? `Uploading... ${uploadProgress}%` : "Done!"}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <Textarea
              data-testid="textarea-text-content"
              placeholder="Paste text, a URL, or drop a file anywhere..."
              className="min-h-[160px] resize-none border-none bg-transparent text-base placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleShare();
              }}
            />
          )}

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <button
              onClick={open}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <UploadCloud className="h-4 w-4" />
              Attach file
            </button>
            <Button
              data-testid="button-share"
              size="sm"
              className="gap-2"
              onClick={handleShare}
              disabled={!canShare || isPending}
            >
              <Send className="h-4 w-4" />
              {isPending ? "Sharing..." : "Share"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
