import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OfferCard } from "@/components/OfferCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter } from "lucide-react";
import { useListOffers, useListCategories } from "@workspace/api-client-react";

export default function Offers() {
  const { t } = useLanguage();
  const searchStr = useSearch();
  const params = new URLSearchParams(searchStr);

  const [search, setSearch] = useState(params.get("search") ?? "");
  const [categoryId, setCategoryId] = useState<number | undefined>(
    params.get("categoryId") ? Number(params.get("categoryId")) : undefined
  );
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useSeo({ title: t("All Offers", "جميع العروض"), description: t("Browse all affiliate offers and bonuses.", "تصفح جميع العروض الحصرية") });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch, categoryId]);

  const { data: offers, isLoading } = useListOffers({
    page,
    limit: 12,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
  });

  const { data: categories } = useListCategories();

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={setSearch} searchValue={search} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs crumbs={[{ label: t("Home", "الرئيسية"), href: "/" }, { label: t("All Offers", "جميع العروض") }]} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold">{t("All Offers", "جميع العروض")}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("Search...", "ابحث...")}
                className="pl-9 w-52 bg-secondary"
              />
            </div>
            <Select
              value={categoryId?.toString() ?? "all"}
              onValueChange={(v) => setCategoryId(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger className="w-44 bg-secondary">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t("Category", "الفئة")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("All Categories", "جميع الفئات")}</SelectItem>
                {categories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.icon} {t(cat.name, cat.nameAr)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(search || categoryId) && (
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryId(undefined); }}>
                {t("Clear", "مسح")}
              </Button>
            )}
          </div>
        </div>

        {offers && (
          <p className="text-sm text-muted-foreground mb-4">
            {t(`Showing ${offers.total} offers`, `عرض ${offers.total} عرض`)}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            : offers?.offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>

        {offers && offers.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              {t("Previous", "السابق")}
            </Button>
            {Array.from({ length: offers.totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="sm"
                onClick={() => setPage(p)}
              >
                {p}
              </Button>
            ))}
            <Button variant="outline" disabled={page >= offers.totalPages} onClick={() => setPage((p) => p + 1)}>
              {t("Next", "التالي")}
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
