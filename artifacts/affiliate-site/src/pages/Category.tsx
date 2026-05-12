import { useState } from "react";
import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OfferCard } from "@/components/OfferCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useListOffers, useListCategories } from "@workspace/api-client-react";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  const category = categories?.find((c) => c.slug === slug);

  useSeo({
    title: category ? t(category.name, category.nameAr) : t("Category", "الفئة"),
    description: t(`Browse ${category?.name ?? ""} offers and bonuses.`, `تصفح عروض ${category?.nameAr ?? ""}`),
  });

  const { data: offers, isLoading } = useListOffers({
    page,
    limit: 12,
    categoryId: category?.id,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs crumbs={[
          { label: t("Home", "الرئيسية"), href: "/" },
          { label: t("Offers", "العروض"), href: "/offers" },
          { label: category ? t(category.name, category.nameAr) : slug ?? "" },
        ]} />

        <div className="mb-8 flex items-center gap-4">
          {category?.icon && <span className="text-4xl">{category.icon}</span>}
          <div>
            <h1 className="text-3xl font-bold">
              {category ? t(category.name, category.nameAr) : slug}
            </h1>
            {category?.description && (
              <p className="text-muted-foreground mt-1">{category.description}</p>
            )}
          </div>
        </div>

        {offers && (
          <p className="text-sm text-muted-foreground mb-6">
            {t(`${offers.total} offers found`, `تم العثور على ${offers.total} عروض`)}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
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
              <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => setPage(p)}>
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
