import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { useHealthCheck, getHealthCheckQueryKey } from "@workspace/api-client-react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { data: health } = useHealthCheck({
    query: {
      queryKey: getHealthCheckQueryKey(),
      refetchInterval: 30000
    }
  });

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border/40 py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-4">
          <p className="text-sm leading-loose text-muted-foreground">
            ShareIt &copy; {new Date().getFullYear()}. Fast, anonymous sharing.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            API Status: 
            <span className="flex items-center gap-1.5">
              <span className={`relative flex h-2.5 w-2.5`}>
                {health?.status === "ok" ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive"></span>
                )}
              </span>
              {health?.status === "ok" ? "Operational" : "Connecting..."}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
