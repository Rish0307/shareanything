import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Link as LinkIcon, FileText } from "lucide-react";
import { useCreateShare } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuthorName } from "@/hooks/use-random-name";

interface ShareZoneProps {
  onSuccess: () => void;
}

export function ShareZone({ onSuccess }: ShareZoneProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text" | "url">("file");
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const { toast } = useToast();
  const createShare = useCreateShare();
  const authorName = useAuthorName();

  const handleShareSuccess = (_id: string) => {
    onSuccess();
    setTextContent("");
    setUrlContent("");
    setUploadProgress(0);
    toast({
      title: "Shared!",
      description: "Your share is now visible in the public feed.",
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    multiple: false,
    noClick: activeTab !== "file",
    noKeyboard: activeTab !== "file",
  });

  const handleTextShare = () => {
    if (!textContent.trim()) return;
    createShare.mutate(
      { data: { type: "text", content: textContent, authorName } },
      {
        onSuccess: (data) => handleShareSuccess(data.id),
        onError: () => {
          toast({ title: "Failed to share text", variant: "destructive" });
        },
      }
    );
  };

  const handleUrlShare = () => {
    if (!urlContent.trim()) return;
    createShare.mutate(
      { data: { type: "url", content: urlContent, authorName } },
      {
        onSuccess: (data) => handleShareSuccess(data.id),
        onError: () => {
          toast({ title: "Failed to share URL", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-3 text-center text-sm text-muted-foreground">
        Sharing as <span className="font-semibold text-primary">{authorName}</span>
      </div>

      <div className="mb-8 flex justify-center gap-4">
        {[
          { id: "file", icon: UploadCloud, label: "File" },
          { id: "text", icon: FileText, label: "Text" },
          { id: "url", icon: LinkIcon, label: "URL" },
        ].map((tab) => (
          <button
            key={tab.id}
            data-testid={`tab-${tab.id}`}
            onClick={() => setActiveTab(tab.id as "file" | "text" | "url")}
            className={cn(
              "flex items-center gap-2 rounded-full px-6 py-3 font-medium transition-all",
              activeTab === tab.id
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </button>
        ))}
      </div>

      <div
        {...getRootProps()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border bg-card hover:border-primary/50",
          activeTab === "file" ? "cursor-pointer" : "cursor-default"
        )}
      >
        <input {...getInputProps()} data-testid="input-file-upload" />

        <div className="flex min-h-[280px] flex-col items-center justify-center p-8 text-center">
          {activeTab === "file" && (
            <>
              <div
                className={cn(
                  "mb-6 flex h-20 w-20 items-center justify-center rounded-full transition-colors",
                  isDragActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                )}
              >
                <UploadCloud className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold">
                {isDragActive ? "Drop to upload" : "Click or drag to upload"}
              </h3>
              <p className="mt-2 text-muted-foreground">Any file type, no size limits.</p>

              {(isUploading || uploadProgress > 0) && (
                <div className="mt-8 w-full max-w-md">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    {isUploading ? `Uploading... ${uploadProgress}%` : "Done!"}
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "text" && (
            <div className="w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
              <Textarea
                data-testid="textarea-text-content"
                placeholder="Paste your text or code here..."
                className="min-h-[180px] resize-none bg-background/50 text-lg font-mono placeholder:font-sans focus-visible:ring-primary"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <Button
                data-testid="button-share-text"
                size="lg"
                className="mt-6 w-full text-lg"
                onClick={handleTextShare}
                disabled={!textContent.trim() || createShare.isPending}
              >
                {createShare.isPending ? "Sharing..." : "Share Text"}
              </Button>
            </div>
          )}

          {activeTab === "url" && (
            <div className="w-full max-w-xl px-4" onClick={(e) => e.stopPropagation()}>
              <Input
                data-testid="input-url-content"
                placeholder="https://..."
                className="h-16 bg-background/50 text-lg focus-visible:ring-primary"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUrlShare();
                }}
              />
              <Button
                data-testid="button-share-url"
                size="lg"
                className="mt-6 w-full text-lg"
                onClick={handleUrlShare}
                disabled={!urlContent.trim() || createShare.isPending}
              >
                {createShare.isPending ? "Sharing..." : "Share URL"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
