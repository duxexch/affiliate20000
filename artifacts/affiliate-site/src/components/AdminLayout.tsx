import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useAdminLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Gift,
  Tag,
  LogOut,
  Trophy,
  ChevronRight,
  Menu,
  X,
  Search,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/offers", label: "Offers", icon: Gift },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/seo", label: "SEO Settings", icon: Search },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAdminAuth();
  const [location] = useLocation();
  const logout = useAdminLogout();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border/50 bg-secondary/20 p-6 text-center space-y-3">
          <p className="font-bold text-lg">Admin session expired</p>
          <p className="text-sm text-muted-foreground">
            Please sign in again to continue.
          </p>
          <Button asChild className="font-bold">
            <Link href="/admin/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  const closeMobileNav = () => setMobileNavOpen(false);

  const SidebarContent = (
    <>
      <div className="p-6 border-b border-border/50">
        <Link href="/" className="flex items-center gap-2" onClick={closeMobileNav}>
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-black text-sm">
            <span className="text-primary">Affiliate</span>Deals
          </span>
        </Link>

        <div className="mt-4 px-2 py-1.5 rounded-lg bg-secondary text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{user.username}</span>
          <span className="ml-1 capitalize text-primary">({user.role})</span>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = location === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={closeMobileNav}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {active && <ChevronRight className="w-3 h-3 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-destructive"
          onClick={() => {
            closeMobileNav();
            logout.mutate(undefined as unknown as void);
          }}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-secondary/30 border-r border-border/50 flex-col">
        {SidebarContent}
      </aside>

      {/* Mobile overlay + sidebar */}
      {mobileNavOpen && (
        <div
          className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-[2px] z-40"
          onClick={closeMobileNav}
        />
      )}

      <aside
        className={[
          "md:hidden fixed top-0 left-0 z-50 w-[85vw] max-w-[320px] h-screen bg-secondary/30 border-r border-border/50 flex flex-col overflow-y-auto",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          "transition-transform duration-200 ease-out",
        ].join(" ")}
        aria-hidden={!mobileNavOpen}
      >
        {SidebarContent}
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto overflow-x-hidden">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-30 bg-background/80 backdrop-blur px-4 py-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border/50 bg-secondary/20 active:scale-[0.98]"
              onClick={() => setMobileNavOpen((v) => !v)}
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="min-w-0">
              <div className="text-sm font-black truncate">
                <span className="text-primary">Affiliate</span>Deals
              </div>
              <div className="text-xs text-muted-foreground truncate">{user.username}</div>
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-5 md:p-8">{children}</div>
      </main>
    </div>
  );
}
