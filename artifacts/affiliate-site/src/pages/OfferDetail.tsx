import { useParams } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { OfferCard } from "@/components/OfferCard";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { StarRating } from "@/components/StarRating";
import { useSeo } from "@/hooks/use-seo";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, TrendingUp, Star, Shield, Clock } from "lucide-react";
import { useGetOfferBySlug, useTrackClick, useListOffers } from "@workspace/api-client-react";

export default function OfferDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { data: offer, isLoading } = useGetOfferBySlug(slug ?? "");
  const { data: related } = useListOffers({ limit: 4, categoryId: offer?.categoryId ?? undefined });
  const trackClick = useTrackClick();

  useSeo({
    title: offer ? t(offer.seoTitle ?? offer.title, offer.seoTitleAr ?? offer.titleAr ?? "") : t("Loading...", "جار التحميل..."),
    description: offer ? t(offer.seoDescription ?? offer.shortDescription ?? "", offer.seoDescriptionAr ?? offer.shortDescriptionAr ?? "") : "",
  });

  const handleClaim = () => {
    if (!offer) return;
    trackClick.mutate(
      { data: { offerId: offer.id, userAgent: navigator.userAgent } },
      { onSuccess: (res) => window.open(res.affiliateUrl, "_blank") }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-4" />
          <Skeleton className="h-80 w-full rounded-xl mb-8" />
          <Skeleton className="h-10 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4" />
        </main>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-5xl mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold mb-4">{t("Offer Not Found", "العرض غير موجود")}</h1>
          <p className="text-muted-foreground">{t("This offer may have expired or been removed.", "ربما انتهت صلاحية هذا العرض أو تمت إزالته.")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Breadcrumbs crumbs={[
          { label: t("Home", "الرئيسية"), href: "/" },
          { label: t("Offers", "العروض"), href: "/offers" },
          ...(offer.category ? [{ label: t(offer.category.name, offer.category.nameAr), href: `/category/${offer.category.slug}` }] : []),
          { label: t(offer.title, offer.titleAr) },
        ]} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative rounded-2xl overflow-hidden aspect-video">
              <img
                src={offer.imageUrl}
                alt={t(offer.title, offer.titleAr)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
              {offer.category && (
                <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur-md">
                  {t(offer.category.name, offer.category.nameAr)}
                </Badge>
              )}
              {offer.isTrending && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  <TrendingUp className="w-3 h-3 mr-1" /> {t("Trending", "رائج")}
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-3xl font-black mb-3">{t(offer.title, offer.titleAr)}</h1>
              <StarRating rating={offer.rating} />
            </div>

            {offer.shortDescription && (
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t(offer.shortDescription, offer.shortDescriptionAr)}
              </p>
            )}

            {offer.longDescription && (
              <div className="prose prose-invert max-w-none">
                <h2 className="text-xl font-bold mb-2">{t("About This Offer", "حول هذا العرض")}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t(offer.longDescription, offer.longDescriptionAr)}
                </p>
              </div>
            )}

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Shield, label: t("Secure", "آمن") },
                { icon: Star, label: t("Top Rated", "الأعلى تقييماً") },
                { icon: Clock, label: t("Fast Payout", "دفع سريع") },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50 text-sm text-muted-foreground">
                  <Icon className="w-5 h-5 text-primary" />
                  {label}
                </div>
              ))}
            </div>

            {/* FAQ Schema section */}
            {offer.faqSchema && (() => {
              try {
                const faqs = JSON.parse(offer.faqSchema) as Array<{ question: string; answer: string }>;
                return (
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold">{t("Frequently Asked Questions", "الأسئلة الشائعة")}</h2>
                    {faqs.map((faq, i) => (
                      <details key={i} className="group rounded-xl bg-secondary/50 border border-border/50 p-4">
                        <summary className="font-medium cursor-pointer list-none flex justify-between items-center">
                          {faq.question}
                          <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                        </summary>
                        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                      </details>
                    ))}
                  </div>
                );
              } catch { return null; }
            })()}
          </div>

          {/* Sticky sidebar CTA */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl bg-secondary/50 border border-primary/20 p-6 space-y-4">
                <h3 className="text-xl font-bold">{t("Claim This Offer", "احصل على هذا العرض")}</h3>
                <StarRating rating={offer.rating} />
                <p className="text-sm text-muted-foreground">
                  {t(offer.shortDescription ?? "", offer.shortDescriptionAr ?? "")}
                </p>
                <Button
                  onClick={handleClaim}
                  disabled={trackClick.isPending}
                  className="w-full font-bold text-lg py-6 shadow-lg shadow-primary/30"
                  size="lg"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {t(offer.ctaText ?? "Claim Bonus", offer.ctaTextAr ?? "احصل على المكافأة")}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t("T&Cs apply. 18+. Play responsibly.", "تطبق الشروط والأحكام. 18+.")}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <span>{t("Total clicks:", "إجمالي النقرات:")}</span>
                  <span className="font-semibold text-foreground">{offer.clickCount.toLocaleString()}</span>
                </div>
              </div>

              {offer.keywords && (
                <div className="flex flex-wrap gap-2">
                  {offer.keywords.split(",").map((kw) => (
                    <Badge key={kw} variant="secondary" className="text-xs">{kw.trim()}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Offers */}
        {related && related.offers.filter((o) => o.id !== offer.id).length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">{t("Related Offers", "عروض مشابهة")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.offers.filter((o) => o.id !== offer.id).slice(0, 4).map((o) => (
                <OfferCard key={o.id} offer={o} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
