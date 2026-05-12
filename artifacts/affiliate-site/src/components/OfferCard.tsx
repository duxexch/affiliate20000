import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Offer } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ChevronRight, TrendingUp, ImageOff } from "lucide-react";
import { useTrackClick } from "@workspace/api-client-react";
import { useState } from "react";

export function OfferCard({ offer }: { offer: Offer }) {
  const { t, language } = useLanguage();
  const trackClick = useTrackClick();
  const [imgError, setImgError] = useState(false);

  const handleClaim = (e: React.MouseEvent) => {
    e.preventDefault();
    trackClick.mutate(
      { data: { offerId: offer.id, userAgent: navigator.userAgent } },
      {
        onSuccess: (res) => {
          window.open(res.affiliateUrl, "_blank", "noopener,noreferrer");
        },
      }
    );
  };

  const rating = Number(offer.rating ?? 0);
  const stars = Math.round(rating);

  return (
    <Card className="group flex flex-col overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur-sm border-border/50 h-full">
      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-secondary/50 shrink-0">
        {!imgError && offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={t(offer.title, offer.titleAr)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary/80">
            <ImageOff className="w-10 h-10 text-muted-foreground/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

        {/* Category badge */}
        {offer.category && (
          <Badge className="absolute top-3 end-3 bg-background/80 backdrop-blur-md text-foreground border-primary/50 text-xs">
            {t(offer.category.name, offer.category.nameAr)}
          </Badge>
        )}

        {/* Trending badge */}
        {offer.isTrending && (
          <Badge className="absolute top-3 start-3 bg-primary/90 text-primary-foreground text-xs">
            <TrendingUp className="w-3 h-3 me-1" />
            {t("Hot", "رائج")}
          </Badge>
        )}

        {/* Rating */}
        <div className="absolute bottom-3 start-3 flex items-center gap-1 bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-sm font-medium">
          <Star className="w-3.5 h-3.5 text-primary fill-primary shrink-0" />
          <span>{rating.toFixed(1)}</span>
          <div className="flex ms-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-2.5 h-2.5 ${i < stars ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="text-base font-bold mb-1.5 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          <Link href={`/offer/${offer.slug}`} className="hover:underline underline-offset-2">
            {t(offer.title, offer.titleAr)}
          </Link>
        </h3>
        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed flex-1">
          {t(offer.shortDescription ?? "", offer.shortDescriptionAr ?? "")}
        </p>
      </CardContent>

      {/* CTA */}
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleClaim}
          disabled={trackClick.isPending}
          className="w-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-95"
          size="sm"
        >
          {trackClick.isPending
            ? t("Opening...", "جاري الفتح...")
            : t(offer.ctaText ?? "Claim Bonus", offer.ctaTextAr ?? "احصل على المكافأة")}
          <ChevronRight
            className={`w-4 h-4 ms-1 transition-transform group-hover:translate-x-0.5 ${language === "ar" ? "rotate-180" : ""}`}
          />
        </Button>
      </CardFooter>
    </Card>
  );
}
