import { useState } from "react";
import { Link, useLocation } from "wouter";
import { LanguageToggle } from "./LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, X, Trophy } from "lucide-react";
import { useListCategories } from "@workspace/api-client-react";

interface NavbarProps {
  onSearch?: (q: string) => void;
  searchValue?: string;
}

export function Navbar({ onSearch, searchValue }: NavbarProps) {
  const [location] = useLocation();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState(searchValue ?? "");
  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQ);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Trophy className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black tracking-tight">
              <span className="text-primary">Affiliate</span>
              <span className="text-foreground">Deals</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/" className={`hover:text-primary transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground"}`}>
              {t("Home", "الرئيسية")}
            </Link>
            <Link href="/offers" className={`hover:text-primary transition-colors ${location === "/offers" ? "text-primary" : "text-muted-foreground"}`}>
              {t("All Offers", "جميع العروض")}
            </Link>
            {categories?.slice(0, 3).map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="hover:text-primary transition-colors text-muted-foreground"
              >
                {t(cat.name, cat.nameAr)}
              </Link>
            ))}
          </nav>

          {/* Search + Lang */}
          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder={t("Search offers...", "ابحث عن العروض...")}
                className="pl-9 bg-secondary border-border/50 h-9 text-sm"
              />
            </form>
            <LanguageToggle />
          </div>

          {/* Mobile toggle */}
          <div className="flex md:hidden items-center gap-2">
            <LanguageToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background px-4 py-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t("Search offers...", "ابحث عن العروض...")}
              className="pl-9"
            />
          </form>
          <nav className="flex flex-col gap-3 text-sm font-medium">
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-primary">{t("Home", "الرئيسية")}</Link>
            <Link href="/offers" onClick={() => setMobileOpen(false)} className="hover:text-primary">{t("All Offers", "جميع العروض")}</Link>
            {categories?.map((cat) => (
              <Link key={cat.id} href={`/category/${cat.slug}`} onClick={() => setMobileOpen(false)} className="hover:text-primary text-muted-foreground">
                {t(cat.name, cat.nameAr)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
