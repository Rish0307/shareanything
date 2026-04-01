import { Link } from "wouter";
import { Activity, Share2 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-primary transition-colors hover:text-primary/80">
          <Share2 className="h-6 w-6" />
          <span className="text-xl tracking-tight">ShareIt</span>
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/stats" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            <Activity className="h-4 w-4" />
            Stats
          </Link>
        </nav>
      </div>
    </header>
  );
}
