import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { useAdminLogout } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Gift,
  Tag,
  Search,
  LogOut,
  Trophy,
  ChevronRight,
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-48" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-secondary/30 border-r border-border/50 flex flex-col">
        <div className="p-6 border-b border-border/50">
          <Link href="/" className="flex items-center gap-2">
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
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
            onClick={() => logout.mutate(undefined as unknown as void)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
