import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Link as LinkIcon, FileText, Check, Copy } from "lucide-react";
import { useCreateShare, useUploadFile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ShareZoneProps {
  onSuccess: () => void;
}

export function ShareZone({ onSuccess }: ShareZoneProps) {
  const [activeTab, setActiveTab] = useState<"file" | "text" | "url">("file");
  const [textContent, setTextContent] = useState("");
  const [urlContent, setUrlContent] = useState("");
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { toast } = useToast();
  const createShare = useCreateShare();
  const uploadFile = useUploadFile();

  const handleShareSuccess = (id: string) => {
    const link = `${window.location.origin}/s/${id}`;
    setShareLink(link);
    onSuccess();
    toast({
      title: "Shared successfully",
      description: "Your link is ready to copy.",
    });
  };

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      
      const formData = new FormData();
      formData.append("file", file);
      
      // Simulate progress for UX
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      uploadFile.mutate(
        { data: { file } as any }, // casting because orval type might differ
        {
          onSuccess: (data) => {
            clearInterval(interval);
            setUploadProgress(100);
            setTimeout(() => {
              handleShareSuccess(data.id);
            }, 300);
          },
          onError: () => {
            clearInterval(interval);
            setUploadProgress(0);
            toast({
              title: "Upload failed",
              description: "Please try again.",
              variant: "destructive",
            });
          },
        }
      );
    },
    [uploadFile, toast]
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
      { data: { type: "text", content: textContent } },
      {
        onSuccess: (data) => {
          handleShareSuccess(data.id);
        },
        onError: () => {
          toast({
            title: "Failed to share text",
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleUrlShare = () => {
    if (!urlContent.trim()) return;
    createShare.mutate(
      { data: { type: "url", content: urlContent } },
      {
        onSuccess: (data) => {
          handleShareSuccess(data.id);
        },
        onError: () => {
          toast({
            title: "Failed to share URL",
            variant: "destructive",
          });
        },
      }
    );
  };

  const copyToClipboard = () => {
    if (!shareLink) return;
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
    });
  };

  const reset = () => {
    setShareLink(null);
    setTextContent("");
    setUrlContent("");
    setUploadProgress(0);
  };

  if (shareLink) {
    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl border border-primary/20 bg-card p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Check className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Ready to share</h2>
            <p className="mt-2 text-muted-foreground">Anyone with this link can access your share.</p>
          </div>
          <div className="flex w-full items-center gap-2">
            <Input readOnly value={shareLink} className="h-12 bg-muted text-lg font-medium font-mono" />
            <Button onClick={copyToClipboard} size="lg" className="h-12 px-8">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? "Copied" : "Copy Link"}
            </Button>
          </div>
          <Button variant="ghost" onClick={reset} className="mt-4">
            Share something else
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-8 flex justify-center gap-4">
        {[
          { id: "file", icon: UploadCloud, label: "File" },
          { id: "text", icon: FileText, label: "Text" },
          { id: "url", icon: LinkIcon, label: "URL" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
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
        <input {...getInputProps()} />
        
        <div className="flex min-h-[320px] flex-col items-center justify-center p-8 text-center">
          {activeTab === "file" && (
            <>
              <div className={cn(
                "mb-6 flex h-24 w-24 items-center justify-center rounded-full transition-colors",
                isDragActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
              )}>
                <UploadCloud className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-bold">
                {isDragActive ? "Drop to upload" : "Click or drag to upload"}
              </h3>
              <p className="mt-2 text-muted-foreground">
                Any file type, instantly shared.
              </p>
              
              {(uploadFile.isPending || uploadProgress > 0) && (
                <div className="mt-8 w-full max-w-md">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground text-center">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </>
          )}

          {activeTab === "text" && (
            <div className="w-full max-w-2xl px-4" onClick={(e) => e.stopPropagation()}>
              <Textarea
                placeholder="Paste your text or code here..."
                className="min-h-[200px] resize-none bg-background/50 text-lg font-mono placeholder:font-sans focus-visible:ring-primary"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
              />
              <Button
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
                placeholder="https://..."
                className="h-16 bg-background/50 text-lg focus-visible:ring-primary"
                value={urlContent}
                onChange={(e) => setUrlContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUrlShare();
                }}
              />
              <Button
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
