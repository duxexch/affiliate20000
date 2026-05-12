import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OfferCard } from "@/components/OfferCard";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Star, ChevronRight, Zap } from "lucide-react";
import {
  useGetFeaturedOffers,
  useGetTrendingOffers,
  useListCategories,
  useListOffers,
} from "@workspace/api-client-react";
import { Link } from "wouter";

export default function Home() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [page, setPage] = useState(1);

  useSeo({
    title: t("Best Affiliate Offers & Bonuses 2025", "أفضل العروض والمكافآت 2025"),
    description: t(
      "Discover top affiliate offers, casino bonuses and sports betting deals. Compare and claim exclusive bonuses today.",
      "اكتشف أفضل العروض الحصرية ومكافآت الكازينو والمراهنات الرياضية"
    ),
  });

  const { data: featured, isLoading: featuredLoading } = useGetFeaturedOffers({ limit: 6 });
  const { data: trending, isLoading: trendingLoading } = useGetTrendingOffers({ limit: 4 });
  const { data: categories } = useListCategories();
  const { data: allOffers, isLoading: allLoading } = useListOffers({ page, limit: 8 });

  return (
    <div className="min-h-screen bg-background">
      <Navbar onSearch={(q) => setLocation(`/offers?search=${encodeURIComponent(q)}`)} />

      {/* Hero */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-4 py-1.5">
            <Zap className="w-3 h-3 mr-1" />
            {t("Exclusive Deals", "عروض حصرية")}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            {t("Find the Best", "اكتشف أفضل")}
            <br />
            <span className="text-primary">{t("Affiliate Bonuses", "عروض المكافآت")}</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {t(
              "Compare exclusive bonuses, free bets, and casino offers from the world's top platforms.",
              "قارن العروض الحصرية والرهانات المجانية ومكافآت الكازينو من أفضل المنصات"
            )}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild className="font-bold px-8 shadow-lg shadow-primary/30">
              <Link href="/offers">{t("Browse All Offers", "تصفح جميع العروض")}</Link>
            </Button>
            {categories?.slice(0, 3).map((cat) => (
              <Button key={cat.id} variant="outline" size="lg" asChild className="border-border/50">
                <Link href={`/category/${cat.slug}`}>
                  <span className="mr-1">{cat.icon}</span>
                  {t(cat.name, cat.nameAr)}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Category Quick Nav */}
      {categories && categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-8">
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border/50 hover:border-primary/50 transition-all text-sm font-medium"
              >
                <span>{cat.icon}</span>
                <span>{t(cat.name, cat.nameAr)}</span>
                <Badge variant="secondary" className="ml-1 text-xs">{cat.offerCount}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Offers */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-primary fill-primary" />
            <h2 className="text-2xl font-bold">{t("Featured Offers", "العروض المميزة")}</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/offers?featured=true">
              {t("View All", "عرض الكل")} <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            : featured?.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      </section>

      {/* Trending */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold">{t("Trending Now", "الأكثر رواجاً")}</h2>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/offers?trending=true">
              {t("View All", "عرض الكل")} <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            : trending?.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
      </section>

      {/* All Offers with pagination */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-6">{t("All Offers", "جميع العروض")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-40 rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ))
            : allOffers?.offers.map((offer) => <OfferCard key={offer.id} offer={offer} />)}
        </div>
        {allOffers && allOffers.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="border-border/50"
            >
              {t("Previous", "السابق")}
            </Button>
            <span className="flex items-center px-4 text-sm text-muted-foreground">
              {page} / {allOffers.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= allOffers.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="border-border/50"
            >
              {t("Next", "التالي")}
            </Button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
